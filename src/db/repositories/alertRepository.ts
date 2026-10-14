import { and, eq, isNull, lte } from 'drizzle-orm';
import { generateUUID, getDatabase } from '../client';
import * as schema from '../schema';
import { AlertRecord, CreateAlertDTO } from '@/types/alert';
import { SyncQueueRepository } from './syncQueueRepository';

export class AlertRepository {
  /**
   * Lista alertas pendentes de uma fazenda até uma determinada data canônica (YYYY-MM-DD).
   */
  static async listPendingByFarm(
    farmId: string,
    upToDate?: string
  ): Promise<AlertRecord[]> {
    const db = getDatabase();

    const conditions = [
      eq(schema.alerts.farmId, farmId),
      isNull(schema.alerts.completedAt),
      isNull(schema.alerts.deletedAt),
    ];

    if (upToDate) {
      conditions.push(lte(schema.alerts.dueDate, upToDate));
    }

    const records = await db
      .select()
      .from(schema.alerts)
      .where(and(...conditions));

    return records as AlertRecord[];
  }

  /**
   * Cria um novo alerta e registra na sync_queue.
   */
  static async create(data: CreateAlertDTO): Promise<AlertRecord> {
    const db = getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();

    const newAlert = {
      id,
      farmId: data.farmId,
      targetAnimalId: data.targetAnimalId,
      type: data.type,
      dueDate: data.dueDate,
      completedAt: null,
      sourceId: data.sourceId ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.insert(schema.alerts).values(newAlert);

    await SyncQueueRepository.enqueue(
      data.farmId,
      'alerts',
      id,
      'INSERT',
      newAlert
    );

    return newAlert as AlertRecord;
  }

  /**
   * Marca um alerta como concluído.
   */
  static async completeAlert(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = await db
      .select()
      .from(schema.alerts)
      .where(eq(schema.alerts.id, id))
      .limit(1);

    if (existing.length === 0) return;

    await db
      .update(schema.alerts)
      .set({
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.alerts.id, id));

    await SyncQueueRepository.enqueue(
      existing[0].farmId,
      'alerts',
      id,
      'UPDATE',
      { completedAt: now, updatedAt: now }
    );
  }

  /**
   * Exclui logicamente todos os alertas associados a uma fonte (ex.: ID de inseminação cancelada).
   */
  static async softDeleteBySourceId(sourceId: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const alertsToCancel = await db
      .select()
      .from(schema.alerts)
      .where(and(eq(schema.alerts.sourceId, sourceId), isNull(schema.alerts.deletedAt)));

    for (const alert of alertsToCancel) {
      await db
        .update(schema.alerts)
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where(eq(schema.alerts.id, alert.id));

      await SyncQueueRepository.enqueue(
        alert.farmId,
        'alerts',
        alert.id,
        'UPDATE',
        { deletedAt: now, updatedAt: now }
      );
    }
  }
}
