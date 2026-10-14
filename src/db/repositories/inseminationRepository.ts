import { and, desc, eq, isNull } from 'drizzle-orm';
import { generateUUID, getDatabase } from '../client';
import * as schema from '../schema';
import {
  calculateReproductiveMilestones,
  resolveAnimalReproStatusAfterCancellation,
} from '@/domain/reproduction';
import {
  CreateInseminationDTO,
  InseminationRecord,
} from '@/types/insemination';
import { AlertRepository } from './alertRepository';
import { SyncQueueRepository } from '@core/sync';

export interface InseminationWithAnimalSummary extends InseminationRecord {
  animalEarTag: string;
  animalName?: string | null;
}

export class InseminationRepository {
  /**
   * Grava uma nova inseminação artificial com transação lógica:
   * 1. Insere o registro em inseminations
   * 2. Atualiza o status da fêmea para 'inseminada'
   * 3. Debita 1 dose do touro (se cadastrado) sem permitir saldo negativo
   * 4. Gera alertas de 21d e 45d vinculados ao source_id da IA
   * 5. Enfileira na sync_queue
   */
  static async createInsemination(
    farmId: string,
    dto: CreateInseminationDTO
  ): Promise<InseminationRecord> {
    const db = getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();

    const milestones = calculateReproductiveMilestones(dto.date);

    const newInsemination: InseminationRecord = {
      id,
      farmId,
      animalId: dto.animalId,
      bullId: dto.bullId ?? null,
      bullName: dto.bullName.trim(),
      date: dto.date,
      inseminator: dto.inseminator.trim(),
      expectedHeatDate: milestones.expectedHeatDate,
      pregnancyCheckDate: milestones.pregnancyCheckDate,
      expectedCalvingDate: milestones.expectedCalvingDate,
      dryOffDate: milestones.dryOffDate,
      result: 'pendente',
      notes: dto.notes ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    // 1. Grava inseminação
    await db.insert(schema.inseminations).values(newInsemination);

    await SyncQueueRepository.enqueue(
      farmId,
      'inseminations',
      id,
      'INSERT',
      newInsemination as unknown as Record<string, unknown>
    );

    // 2. Atualiza status reprodutivo da fêmea para 'inseminada'
    await db
      .update(schema.animals)
      .set({
        reproStatus: 'inseminada',
        updatedAt: now,
      })
      .where(eq(schema.animals.id, dto.animalId));

    await SyncQueueRepository.enqueue(
      farmId,
      'animals',
      dto.animalId,
      'UPDATE',
      { reproStatus: 'inseminada', updatedAt: now }
    );

    // 3. Se for touro do catálogo com ID, debita 1 dose de sêmen
    if (dto.bullId) {
      const bullRecord = await db
        .select()
        .from(schema.bulls)
        .where(eq(schema.bulls.id, dto.bullId))
        .limit(1);

      if (bullRecord.length > 0) {
        const novoSaldo = Math.max(0, bullRecord[0].strawsInStock - 1);
        await db
          .update(schema.bulls)
          .set({
            strawsInStock: novoSaldo,
            updatedAt: now,
          })
          .where(eq(schema.bulls.id, dto.bullId));

        await SyncQueueRepository.enqueue(
          farmId,
          'bulls',
          dto.bullId,
          'UPDATE',
          { strawsInStock: novoSaldo, updatedAt: now }
        );
      }
    }

    // 4. Cria alertas zootécnicos automáticos
    await AlertRepository.create({
      farmId,
      targetAnimalId: dto.animalId,
      type: 'heat_check_21d',
      dueDate: milestones.expectedHeatDate,
      sourceId: id,
      notes: `Vigiar retorno de cio pós-IA com ${dto.bullName}`,
    });

    await AlertRepository.create({
      farmId,
      targetAnimalId: dto.animalId,
      type: 'pregnancy_check_45d',
      dueDate: milestones.pregnancyCheckDate,
      sourceId: id,
      notes: `Exame de toque veterinário pós-IA com ${dto.bullName}`,
    });

    return newInsemination;
  }

  /**
   * Lista as últimas inseminações da fazenda ordenadas por data decrescente.
   */
  static async listRecentByFarm(
    farmId: string,
    limit: number = 20
  ): Promise<InseminationWithAnimalSummary[]> {
    const db = getDatabase();

    const result = await db
      .select({
        insemination: schema.inseminations,
        animal: schema.animals,
      })
      .from(schema.inseminations)
      .innerJoin(
        schema.animals,
        eq(schema.inseminations.animalId, schema.animals.id)
      )
      .where(
        and(
          eq(schema.inseminations.farmId, farmId),
          isNull(schema.inseminations.deletedAt)
        )
      )
      .orderBy(desc(schema.inseminations.date), desc(schema.inseminations.createdAt))
      .limit(limit);

    return result.map(({ insemination, animal }) => ({
      ...insemination,
      result: insemination.result as InseminationRecord['result'],
      animalEarTag: animal.earTag,
      animalName: animal.name,
    }));
  }

  /**
   * Lista histórico ativo de inseminações de um animal específico.
   */
  static async listByAnimal(animalId: string): Promise<InseminationRecord[]> {
    const db = getDatabase();

    const records = await db
      .select()
      .from(schema.inseminations)
      .where(
        and(
          eq(schema.inseminations.animalId, animalId),
          isNull(schema.inseminations.deletedAt)
        )
      )
      .orderBy(desc(schema.inseminations.date));

    return records.map((r) => ({
      ...r,
      result: r.result as InseminationRecord['result'],
    }));
  }

  /**
   * Exclui logicamente uma inseminação lançada por engano:
   * - Marca deleted_at na inseminação
   * - Cancela/deleta alertas gerados por ela
   * - Estorna 1 dose de sêmen para o touro se solicitado
   * - Recalcula deterministicamente o status da fêmea via motor zootécnico
   */
  static async deleteInsemination(
    inseminationId: string,
    options: { restoreStrawStock: boolean }
  ): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = await db
      .select()
      .from(schema.inseminations)
      .where(eq(schema.inseminations.id, inseminationId))
      .limit(1);

    if (existing.length === 0) return;
    const ia = existing[0];

    // 1. Marca soft delete na inseminação
    await db
      .update(schema.inseminations)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.inseminations.id, inseminationId));

    await SyncQueueRepository.enqueue(
      ia.farmId,
      'inseminations',
      inseminationId,
      'UPDATE',
      { deletedAt: now, updatedAt: now }
    );

    // 2. Cancela alertas gerados por esta IA
    await AlertRepository.softDeleteBySourceId(inseminationId);

    // 3. Estorna dose de sêmen para o touro catalogado se solicitado
    if (options.restoreStrawStock && ia.bullId) {
      const bullRecord = await db
        .select()
        .from(schema.bulls)
        .where(eq(schema.bulls.id, ia.bullId))
        .limit(1);

      if (bullRecord.length > 0) {
        const novoSaldo = bullRecord[0].strawsInStock + 1;
        await db
          .update(schema.bulls)
          .set({
            strawsInStock: novoSaldo,
            updatedAt: now,
          })
          .where(eq(schema.bulls.id, ia.bullId));

        await SyncQueueRepository.enqueue(
          ia.farmId,
          'bulls',
          ia.bullId,
          'UPDATE',
          { strawsInStock: novoSaldo, updatedAt: now }
        );
      }
    }

    // 4. Recalcula o status da vaca com base no histórico restante
    const remainingHistory = await this.listByAnimal(ia.animalId);
    const novoStatus = resolveAnimalReproStatusAfterCancellation(remainingHistory);

    await db
      .update(schema.animals)
      .set({
        reproStatus: novoStatus,
        updatedAt: now,
      })
      .where(eq(schema.animals.id, ia.animalId));

    await SyncQueueRepository.enqueue(
      ia.farmId,
      'animals',
      ia.animalId,
      'UPDATE',
      { reproStatus: novoStatus, updatedAt: now }
    );
  }
}
