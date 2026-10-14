import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDatabase } from '@core/db/client';
import { animals } from '@features/herd/infra/animal.schema';
import { InseminationRepository } from '../domain/insemination.repository';
import {
  InseminationRecord,
  InseminationWithAnimalSummary,
} from '../domain/insemination.entity';
import { inseminations } from './insemination.schema';
import { InseminationMapper } from './insemination.mapper';

export class InseminationSqliteRepository implements InseminationRepository {
  async listRecentByFarm(
    farmId: string,
    limit: number = 20
  ): Promise<InseminationWithAnimalSummary[]> {
    const db = getDatabase();

    const rows = await db
      .select({
        insemination: inseminations,
        animal: animals,
      })
      .from(inseminations)
      .innerJoin(animals, eq(inseminations.animalId, animals.id))
      .where(
        and(
          eq(inseminations.farmId, farmId),
          isNull(inseminations.deletedAt)
        )
      )
      .orderBy(desc(inseminations.date), desc(inseminations.createdAt))
      .limit(limit);

    return rows.map(({ insemination, animal }) => {
      const domain = InseminationMapper.toDomain(insemination);
      return {
        ...domain,
        animalEarTag: animal.earTag,
        animalName: animal.name,
      };
    });
  }

  async listByAnimal(animalId: string): Promise<InseminationRecord[]> {
    const db = getDatabase();

    const rows = await db
      .select()
      .from(inseminations)
      .where(
        and(
          eq(inseminations.animalId, animalId),
          isNull(inseminations.deletedAt)
        )
      )
      .orderBy(desc(inseminations.date));

    return rows.map(InseminationMapper.toDomain);
  }

  async findById(id: string): Promise<InseminationRecord | null> {
    const db = getDatabase();

    const rows = await db
      .select()
      .from(inseminations)
      .where(
        and(
          eq(inseminations.id, id),
          isNull(inseminations.deletedAt)
        )
      )
      .limit(1);

    if (rows.length === 0) return null;
    return InseminationMapper.toDomain(rows[0]);
  }

  async save(insemination: InseminationRecord): Promise<void> {
    const db = getDatabase();
    const record = InseminationMapper.toPersistence(insemination);
    await db.insert(inseminations).values(record);
  }

  async update(
    id: string,
    updates: Partial<InseminationRecord>
  ): Promise<InseminationRecord> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const dbUpdates: Partial<typeof inseminations.$inferInsert> = {
      ...updates,
      updatedAt: now,
    };

    await db.update(inseminations).set(dbUpdates).where(eq(inseminations.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Inseminação com ID ${id} não encontrada após atualização.`);
    }
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(inseminations)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(inseminations.id, id));
  }
}
