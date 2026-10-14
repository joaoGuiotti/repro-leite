import { eq, count, inArray, asc } from 'drizzle-orm';
import { getDatabase, generateUUID } from '@/db/client';
import * as schema from '@/db/schema';

export class OutboxRepository {
  /**
   * Retorna a quantidade de alterações locais pendentes de sincronização.
   */
  static async getPendingCount(farmId: string): Promise<number> {
    const db = getDatabase();
    const result = await db
      .select({ count: count() })
      .from(schema.syncQueue)
      .where(eq(schema.syncQueue.farmId, farmId));

    return result[0]?.count ?? 0;
  }

  /**
   * Enfileira uma nova alteração local para envio ao Supabase.
   */
  static async enqueue(
    farmId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payloadJson?: Record<string, unknown> | null
  ): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.insert(schema.syncQueue).values({
      id: generateUUID(),
      farmId,
      tableName,
      recordId,
      operation,
      payloadJson: payloadJson ? JSON.stringify(payloadJson) : null,
      attempts: 0,
      lastError: null,
      createdAt: now,
    });
  }

  /**
   * Espia um lote de registros pendentes para envio.
   */
  static async peekBatch(farmId: string, limit: number = 50): Promise<schema.SyncQueueEntry[]> {
    const db = getDatabase();
    return db
      .select()
      .from(schema.syncQueue)
      .where(eq(schema.syncQueue.farmId, farmId))
      .orderBy(asc(schema.syncQueue.createdAt))
      .limit(limit);
  }

  /**
   * Remove registros da fila após confirmação de persistência pelo servidor.
   */
  static async removeBatch(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = getDatabase();
    await db.delete(schema.syncQueue).where(inArray(schema.syncQueue.id, ids));
  }

  /**
   * Registra uma falha de tentativa de envio para controle de backoff.
   */
  static async recordFailure(id: string, errorMessage: string): Promise<void> {
    const db = getDatabase();
    const existing = await db.select().from(schema.syncQueue).where(eq(schema.syncQueue.id, id)).limit(1);
    if (existing.length > 0) {
      await db
        .update(schema.syncQueue)
        .set({
          attempts: existing[0].attempts + 1,
          lastError: errorMessage,
        })
        .where(eq(schema.syncQueue.id, id));
    }
  }
}

export { OutboxRepository as SyncQueueRepository };

