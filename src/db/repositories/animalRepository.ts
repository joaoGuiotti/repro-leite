import { eq, and, isNull, desc } from 'drizzle-orm';
import { getDatabase, generateUUID } from '../client';
import * as schema from '../schema';
import { AnimalRecord, CreateAnimalDTO, RegisterExitDTO } from '@/types/animal';
import { normalizeEarTag } from '@/domain/earTag';
import { SyncQueueRepository } from '@core/sync';



export class AnimalRepository {
  /**
   * Lista todos os animais não deletados de uma fazenda, ordenando ativos primeiro.
   */
  static async listByFarm(farmId: string, includeInactive: boolean = true): Promise<AnimalRecord[]> {
    const db = getDatabase();

    const query = db
      .select()
      .from(schema.animals)
      .where(and(eq(schema.animals.farmId, farmId), isNull(schema.animals.deletedAt)))
      .orderBy(desc(schema.animals.createdAt));

    const records = await query;

    return (records as AnimalRecord[]).filter((animal) => {
      if (!includeInactive && animal.exitStatus !== 'ativo') {
        return false;
      }
      return true;
    });
  }

  /**
   * Busca um animal por ID.
   */
  static async findById(id: string): Promise<AnimalRecord | null> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(schema.animals)
      .where(and(eq(schema.animals.id, id), isNull(schema.animals.deletedAt)))
      .limit(1);

    return (result[0] as AnimalRecord) ?? null;
  }

  /**
   * Cadastra um novo animal e enfileira na sync_queue.
   */
  static async create(data: CreateAnimalDTO): Promise<AnimalRecord> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = generateUUID();
    const earTagNormalized = normalizeEarTag(data.earTag);

    // Se for macho, status reprodutivo é 'nao_se_aplica'
    const reproStatus = data.sex === 'macho' ? 'nao_se_aplica' : (data.reproStatus ?? 'vazia');

    const newAnimal = {
      id,
      farmId: data.farmId,
      earTag: data.earTag.trim(),
      earTagNormalized,
      name: data.name ? data.name.trim() : null,
      breed: data.breed.trim(),
      sex: data.sex,
      birthDate: data.birthDate,
      birthWeightKg: data.birthWeightKg ?? 40.0,
      lifeStage: data.lifeStage ?? 'adulta',
      reproStatus,
      exitStatus: 'ativo' as const,
      exitDate: null,
      exitReason: null,
      notes: data.notes ? data.notes.trim() : null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.insert(schema.animals).values(newAnimal);

    // Enfileira mutação de inserção
    await SyncQueueRepository.enqueue(
      data.farmId,
      'animals',
      id,
      'INSERT',
      newAnimal as unknown as Record<string, unknown>
    );

    return newAnimal as AnimalRecord;
  }

  /**
   * Atualiza os dados cadastrais de um animal existente e enfileira na sync_queue.
   */
  static async update(id: string, data: Partial<CreateAnimalDTO>): Promise<AnimalRecord> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const updates: Partial<typeof schema.animals.$inferInsert> = {
      updatedAt: now,
    };

    if (data.earTag !== undefined) {
      updates.earTag = data.earTag.trim();
      updates.earTagNormalized = normalizeEarTag(data.earTag);
    }
    if (data.name !== undefined) updates.name = data.name ? data.name.trim() : null;
    if (data.breed !== undefined) updates.breed = data.breed.trim();
    if (data.sex !== undefined) updates.sex = data.sex;
    if (data.birthDate !== undefined) updates.birthDate = data.birthDate;
    if (data.birthWeightKg !== undefined) updates.birthWeightKg = data.birthWeightKg;
    if (data.lifeStage !== undefined) updates.lifeStage = data.lifeStage;
    if (data.reproStatus !== undefined) updates.reproStatus = data.reproStatus;
    if (data.notes !== undefined) updates.notes = data.notes ? data.notes.trim() : null;

    await db.update(schema.animals).set(updates).where(eq(schema.animals.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Animal com ID ${id} não encontrado após atualização.`);
    }

    await SyncQueueRepository.enqueue(
      updated.farmId,
      'animals',
      id,
      'UPDATE',
      updated as unknown as Record<string, unknown>
    );

    return updated;
  }

  /**
   * Registra a saída zootécnica de um animal do rebanho ativo (venda, descarte, morte).
   */
  static async registerExit(data: RegisterExitDTO): Promise<AnimalRecord> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(schema.animals)
      .set({
        exitStatus: data.exitStatus,
        exitDate: data.exitDate,
        exitReason: data.exitReason ? data.exitReason.trim() : null,
        updatedAt: now,
      })
      .where(eq(schema.animals.id, data.animalId));

    const updated = await this.findById(data.animalId);
    if (!updated) {
      throw new Error(`Animal ${data.animalId} não encontrado após registro de saída.`);
    }

    await SyncQueueRepository.enqueue(
      updated.farmId,
      'animals',
      data.animalId,
      'UPDATE',
      updated as unknown as Record<string, unknown>
    );

    return updated;
  }

  /**
   * Reativa um animal inativo de volta ao status 'ativo' (caso o brinco esteja livre).
   */
  static async reactivate(animalId: string): Promise<AnimalRecord> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(schema.animals)
      .set({
        exitStatus: 'ativo',
        exitDate: null,
        exitReason: null,
        updatedAt: now,
      })
      .where(eq(schema.animals.id, animalId));

    const updated = await this.findById(animalId);
    if (!updated) {
      throw new Error(`Animal ${animalId} não encontrado após reativação.`);
    }

    await SyncQueueRepository.enqueue(
      updated.farmId,
      'animals',
      animalId,
      'UPDATE',
      updated as unknown as Record<string, unknown>
    );

    return updated;
  }

  /**
   * Exclusão lógica (soft delete) reservada para cadastros feitos por engano.
   */
  static async softDelete(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const animal = await this.findById(id);

    if (!animal) return;

    await db
      .update(schema.animals)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.animals.id, id));

    await SyncQueueRepository.enqueue(
      animal.farmId,
      'animals',
      id,
      'DELETE',
      null
    );
  }
}
