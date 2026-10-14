import { and, asc, eq, isNull } from 'drizzle-orm';
import { getDatabase } from '@core/db/client';
import { BullRepository } from '../domain/bull.repository';
import { BullRecord } from '../domain/bull.entity';
import { adjustBullStock } from '../domain/bull-stock';
import { bulls } from './bull.schema';
import { BullMapper } from './bull.mapper';

export class BullSqliteRepository implements BullRepository {
  async listByFarm(farmId: string): Promise<BullRecord[]> {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(bulls)
      .where(and(eq(bulls.farmId, farmId), isNull(bulls.deletedAt)))
      .orderBy(asc(bulls.name));

    return rows.map(BullMapper.toDomain);
  }

  async findById(id: string): Promise<BullRecord | null> {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(bulls)
      .where(and(eq(bulls.id, id), isNull(bulls.deletedAt)))
      .limit(1);

    if (rows.length === 0) return null;
    return BullMapper.toDomain(rows[0]);
  }

  async save(bull: BullRecord): Promise<void> {
    const db = getDatabase();
    const record = BullMapper.toPersistence(bull);
    await db.insert(bulls).values(record);
  }

  async update(id: string, updates: Partial<BullRecord>): Promise<BullRecord> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const dbUpdates: Partial<typeof bulls.$inferInsert> = {
      ...updates,
      updatedAt: now,
    };

    await db.update(bulls).set(dbUpdates).where(eq(bulls.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Touro com ID ${id} não encontrado após atualização.`);
    }
    return updated;
  }

  async adjustStraws(id: string, delta: number): Promise<BullRecord> {
    const bull = await this.findById(id);
    if (!bull) {
      throw new Error(`Touro com ID ${id} não encontrado.`);
    }

    const newStraws = adjustBullStock(bull.strawsInStock, delta);
    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(bulls)
      .set({
        strawsInStock: newStraws,
        updatedAt: now,
      })
      .where(eq(bulls.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Touro com ID ${id} não encontrado após ajuste de doses.`);
    }
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(bulls)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(bulls.id, id));
  }
}
