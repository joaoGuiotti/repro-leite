import { OutboxRepository } from './outbox.repository';
import { RemoteSyncGateway, RemoteOutboxItem } from '../network/api-client';
import { getDatabase } from '@core/db/client';
import * as schema from '@core/db/schema';
import { eq } from 'drizzle-orm';

export interface PushResult {
  pushedCount: number;
  failedCount: number;
  hasMore: boolean;
}

export class PushEngine {
  /**
   * Drena a outbox local em lote, enviando as mutações de forma idempotente ao gateway remoto.
   */
  static async push(
    farmId: string,
    gateway: RemoteSyncGateway,
    batchSize: number = 50,
    now: Date = new Date(),
    force: boolean = false
  ): Promise<PushResult> {
    const batch = force
      ? await OutboxRepository.peekBatch(farmId, batchSize, now, true)
      : await OutboxRepository.peekBatch(farmId, batchSize, now);

    if (batch.length === 0) {
      return {
        pushedCount: 0,
        failedCount: 0,
        hasMore: false,
      };
    }

    const ids = batch.map((item) => item.id);
    await OutboxRepository.markInFlight(ids);

    const remoteItems: RemoteOutboxItem[] = batch.map((item) => ({
      operationId: item.operationId || item.id,
      farmId: item.farmId,
      tableName: item.tableName,
      recordId: item.recordId,
      operation: item.operation as 'INSERT' | 'UPDATE' | 'DELETE',
      payload: item.payloadJson ? JSON.parse(item.payloadJson) : null,
      createdAt: item.createdAt,
    }));

    try {
      const response = await gateway.pushBatch(remoteItems);

      const processedSet = new Set(response.processedOperationIds);
      const failedMap = new Map<string, string>();

      if (response.failedOperations) {
        for (const failure of response.failedOperations) {
          failedMap.set(failure.operationId, failure.error);
        }
      }

      const completedIds: string[] = [];
      let failedCount = 0;

      for (const item of batch) {
        const opId = item.operationId || item.id;
        if (processedSet.has(opId) && !failedMap.has(opId)) {
          completedIds.push(item.id);
        } else {
          failedCount++;
          const errorMsg = failedMap.get(opId) ?? 'Falha no processamento remoto';
          const backoffDelay = this.calculateBackoff(item.attempts);
          await OutboxRepository.recordFailure(item.id, errorMsg, backoffDelay);
        }
      }

      if (completedIds.length > 0) {
        await OutboxRepository.markCompleted(completedIds);
      }

      // Atualiza timestamp de push no sync_state
      await this.updateLastPushedAt(farmId, now);

      return {
        pushedCount: completedIds.length,
        failedCount,
        hasMore: batch.length === batchSize,
      };
    } catch (networkError: unknown) {
      const errorMsg = networkError instanceof Error ? networkError.message : String(networkError);

      for (const item of batch) {
        const backoffDelay = this.calculateBackoff(item.attempts);
        await OutboxRepository.recordFailure(item.id, errorMsg, backoffDelay);
      }

      throw networkError;
    }
  }

  /**
   * Calcula backoff exponencial com jitter (2s, 4s, 8s, 16s... até 5 minutos).
   */
  private static calculateBackoff(attempts: number): number {
    const baseMs = 2000;
    const maxMs = 300000; // 5 minutos
    const exponential = baseMs * Math.pow(2, attempts);
    const jitter = Math.random() * 1000;
    return Math.min(maxMs, exponential + jitter);
  }

  private static async updateLastPushedAt(farmId: string, date: Date): Promise<void> {
    const db = getDatabase();
    const nowIso = date.toISOString();

    const existing = await db
      .select()
      .from(schema.syncState)
      .where(eq(schema.syncState.farmId, farmId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.syncState)
        .set({
          lastPushedAt: nowIso,
          updatedAt: nowIso,
        })
        .where(eq(schema.syncState.farmId, farmId));
    } else {
      await db.insert(schema.syncState).values({
        id: farmId,
        farmId,
        lastPushedAt: nowIso,
        updatedAt: nowIso,
      });
    }
  }
}
