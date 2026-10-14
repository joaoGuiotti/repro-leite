import { eq, and, isNull, asc } from 'drizzle-orm';
import { getDatabase, generateUUID } from '../client';
import * as schema from '../schema';
import { BullRecord, CreateBullDTO, UpdateBullDTO } from '@/types/bull';
import { adjustBullStock } from '@/domain/bullStock';
import { SyncQueueRepository } from '@core/sync';

export class BullRepository {
  /**
   * Lista todos os touros ativos (não deletados) de uma fazenda, ordenados por nome.
   */
  static async listByFarm(farmId: string): Promise<BullRecord[]> {
    const db = getDatabase();

    const records = await db
      .select()
      .from(schema.bulls)
      .where(and(eq(schema.bulls.farmId, farmId), isNull(schema.bulls.deletedAt)))
      .orderBy(asc(schema.bulls.name));

    return records as BullRecord[];
  }

  /**
   * Busca um touro por ID.
   */
  static async findById(id: string): Promise<BullRecord | null> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(schema.bulls)
      .where(and(eq(schema.bulls.id, id), isNull(schema.bulls.deletedAt)))
      .limit(1);

    return (result[0] as BullRecord) ?? null;
  }

  /**
   * Cadastra um novo touro no catálogo e enfileira na sync_queue.
   */
  static async create(data: CreateBullDTO): Promise<BullRecord> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = generateUUID();

    const newBull = {
      id,
      farmId: data.farmId,
      name: data.name.trim(),
      breed: data.breed.trim(),
      code: data.code ? data.code.trim() : null,
      strawsInStock: Math.max(0, data.strawsInStock ?? 0),
      notes: data.notes ? data.notes.trim() : null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.insert(schema.bulls).values(newBull);

    await SyncQueueRepository.enqueue(
      data.farmId,
      'bulls',
      id,
      'INSERT',
      newBull as unknown as Record<string, unknown>
    );

    return newBull as BullRecord;
  }

  /**
   * Atualiza dados de identificação do touro.
   */
  static async update(id: string, data: UpdateBullDTO): Promise<BullRecord> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const updates: Partial<typeof schema.bulls.$inferInsert> = {
      updatedAt: now,
    };

    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.breed !== undefined) updates.breed = data.breed.trim();
    if (data.code !== undefined) updates.code = data.code ? data.code.trim() : null;
    if (data.notes !== undefined) updates.notes = data.notes ? data.notes.trim() : null;

    await db.update(schema.bulls).set(updates).where(eq(schema.bulls.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Touro com ID ${id} não encontrado após atualização.`);
    }

    await SyncQueueRepository.enqueue(
      updated.farmId,
      'bulls',
      id,
      'UPDATE',
      updated as unknown as Record<string, unknown>
    );

    return updated;
  }

  /**
   * Ajusta o saldo de doses (+ / - delta) utilizando o motor puro de estoque.
   */
  static async adjustStraws(id: string, delta: number): Promise<BullRecord> {
    const bull = await this.findById(id);
    if (!bull) {
      throw new Error(`Touro com ID ${id} não encontrado.`);
    }

    const newStraws = adjustBullStock(bull.strawsInStock, delta);
    return this.setStraws(id, newStraws);
  }

  /**
   * Define diretamente a quantidade de doses em estoque.
   */
  static async setStraws(id: string, newCount: number): Promise<BullRecord> {
    if (newCount < 0) {
      throw new Error('A quantidade de doses não pode ser inferior a zero.');
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(schema.bulls)
      .set({
        strawsInStock: newCount,
        updatedAt: now,
      })
      .where(eq(schema.bulls.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Touro com ID ${id} não encontrado após ajuste de doses.`);
    }

    await SyncQueueRepository.enqueue(
      updated.farmId,
      'bulls',
      id,
      'UPDATE',
      updated as unknown as Record<string, unknown>
    );

    return updated;
  }

  /**
   * Exclusão lógica (soft delete) de touro.
   */
  static async softDelete(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const bull = await this.findById(id);

    if (!bull) return;

    await db
      .update(schema.bulls)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.bulls.id, id));

    await SyncQueueRepository.enqueue(
      bull.farmId,
      'bulls',
      id,
      'DELETE',
      null
    );
  }
}
