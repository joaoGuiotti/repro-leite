import { eq, and, isNull, desc } from 'drizzle-orm';
import { getDatabase } from '@core/db/client';
import { AnimalRepository } from '../domain/animal.repository';
import { AnimalRecord, RegisterExitDTO } from '../domain/animal.entity';
import { animals } from './animal.schema';
import { AnimalMapper } from './animal.mapper';

export class AnimalSqliteRepository implements AnimalRepository {
  async listByFarm(farmId: string, includeInactive: boolean = true): Promise<AnimalRecord[]> {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(animals)
      .where(and(eq(animals.farmId, farmId), isNull(animals.deletedAt)))
      .orderBy(desc(animals.createdAt));

    const domainList = rows.map(AnimalMapper.toDomain);
    if (!includeInactive) {
      return domainList.filter((a) => a.exitStatus === 'ativo');
    }
    return domainList;
  }

  async findById(id: string): Promise<AnimalRecord | null> {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(animals)
      .where(and(eq(animals.id, id), isNull(animals.deletedAt)))
      .limit(1);

    if (rows.length === 0) return null;
    return AnimalMapper.toDomain(rows[0]);
  }

  async findByEarTag(
    farmId: string,
    earTagNormalized: string,
    onlyActive: boolean = false
  ): Promise<AnimalRecord | null> {
    const db = getDatabase();
    const conditions = [
      eq(animals.farmId, farmId),
      eq(animals.earTagNormalized, earTagNormalized),
      isNull(animals.deletedAt),
    ];
    if (onlyActive) {
      conditions.push(eq(animals.exitStatus, 'ativo'));
    }

    const rows = await db
      .select()
      .from(animals)
      .where(and(...conditions))
      .orderBy(desc(animals.createdAt))
      .limit(1);

    if (rows.length === 0) return null;
    return AnimalMapper.toDomain(rows[0]);
  }

  async save(animal: AnimalRecord): Promise<void> {
    const db = getDatabase();
    const record = AnimalMapper.toPersistence(animal);
    await db.insert(animals).values(record);
  }

  async update(id: string, updates: Partial<AnimalRecord>): Promise<AnimalRecord> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const { earTagConflict, ...restUpdates } = updates;
    const dbUpdates: Partial<typeof animals.$inferInsert> = {
      ...restUpdates,
      ...(earTagConflict !== undefined ? { earTagConflict: earTagConflict ? 1 : 0 } : {}),
      updatedAt: now,
    };

    await db.update(animals).set(dbUpdates).where(eq(animals.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Animal com ID ${id} não encontrado após atualização.`);
    }
    return updated;
  }

  async registerExit(data: RegisterExitDTO): Promise<AnimalRecord> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(animals)
      .set({
        exitStatus: data.exitStatus,
        exitDate: data.exitDate,
        exitReason: data.exitReason ? data.exitReason.trim() : null,
        updatedAt: now,
      })
      .where(eq(animals.id, data.animalId));

    const updated = await this.findById(data.animalId);
    if (!updated) {
      throw new Error(`Animal ${data.animalId} não encontrado após registro de saída.`);
    }
    return updated;
  }

  async reactivate(animalId: string): Promise<AnimalRecord> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(animals)
      .set({
        exitStatus: 'ativo',
        exitDate: null,
        exitReason: null,
        updatedAt: now,
      })
      .where(eq(animals.id, animalId));

    const updated = await this.findById(animalId);
    if (!updated) {
      throw new Error(`Animal ${animalId} não encontrado após reativação.`);
    }
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(animals)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(animals.id, id));
  }
}
