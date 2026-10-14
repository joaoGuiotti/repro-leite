import { and, asc, eq, isNull, lte } from 'drizzle-orm';
import { getDatabase } from '@core/db/client';
import { animals } from '@features/herd/infra/animal.schema';
import { AlertRecord, AlertWithAnimalSummary } from '../domain/alert.entity';
import { AlertRepository } from '../domain/alert.repository';
import { alerts } from './alert.schema';
import { AlertMapper } from './alert.mapper';

export class AlertSqliteRepository implements AlertRepository {
  async findById(id: string): Promise<AlertRecord | null> {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.id, id), isNull(alerts.deletedAt)))
      .limit(1);

    if (rows.length === 0) return null;
    return AlertMapper.toDomain(rows[0]);
  }

  async listPendingByFarm(
    farmId: string,
    upToDate?: string
  ): Promise<AlertWithAnimalSummary[]> {
    const db = getDatabase();

    const conditions = [
      eq(alerts.farmId, farmId),
      isNull(alerts.completedAt),
      isNull(alerts.deletedAt),
    ];

    if (upToDate) {
      conditions.push(lte(alerts.dueDate, upToDate));
    }

    const rows = await db
      .select({
        alert: alerts,
        animalEarTag: animals.earTag,
        animalName: animals.name,
      })
      .from(alerts)
      .innerJoin(animals, eq(alerts.targetAnimalId, animals.id))
      .where(and(...conditions))
      .orderBy(asc(alerts.dueDate));

    return rows.map((r) =>
      AlertMapper.toDomainWithAnimal(r.alert, {
        earTag: r.animalEarTag,
        name: r.animalName,
      })
    );
  }

  async save(alert: AlertRecord): Promise<void> {
    const db = getDatabase();
    const existing = await this.findById(alert.id);

    if (existing) {
      await db
        .update(alerts)
        .set({
          targetAnimalId: alert.targetAnimalId,
          type: alert.type,
          dueDate: alert.dueDate,
          completedAt: alert.completedAt,
          sourceId: alert.sourceId,
          notes: alert.notes,
          updatedAt: alert.updatedAt,
          deletedAt: alert.deletedAt,
        })
        .where(eq(alerts.id, alert.id));
    } else {
      await db.insert(alerts).values({
        id: alert.id,
        farmId: alert.farmId,
        targetAnimalId: alert.targetAnimalId,
        type: alert.type,
        dueDate: alert.dueDate,
        completedAt: alert.completedAt,
        sourceId: alert.sourceId,
        notes: alert.notes,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
        deletedAt: alert.deletedAt,
      });
    }
  }

  async complete(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(alerts)
      .set({
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(alerts.id, id));
  }

  async softDeleteBySourceId(sourceId: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(alerts)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(and(eq(alerts.sourceId, sourceId), isNull(alerts.deletedAt)));
  }

  async softDelete(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(alerts)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(alerts.id, id));
  }
}
