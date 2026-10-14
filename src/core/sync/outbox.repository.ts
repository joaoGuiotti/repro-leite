import { eq, count, inArray, asc, and, or, isNull, lte } from 'drizzle-orm';
import { getDatabase, generateUUID } from '@/db/client';
import * as schema from '@/db/schema';

export type OutboxStatus = 'pending' | 'in_flight' | 'failed' | 'completed';

export interface EnqueueOptions {
  farmId: string;
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payloadJson?: Record<string, unknown> | null;
  operationId?: string;
}

export class OutboxRepository {
  /**
   * Retorna a quantidade de alterações locais pendentes de sincronização
   * (status 'pending', 'in_flight' ou 'failed').
   */
  static async getPendingCount(farmId: string): Promise<number> {
    const db = getDatabase();
    const result = await db
      .select({ count: count() })
      .from(schema.syncQueue)
      .where(
        and(
          eq(schema.syncQueue.farmId, farmId),
          inArray(schema.syncQueue.status, ['pending', 'in_flight', 'failed'])
        )
      );

    return result[0]?.count ?? 0;
  }

  /**
   * Enfileira uma nova alteração local para envio idempotente.
   * Suporta sobrecarga posicional legada e novo objeto EnqueueOptions.
   */
  static async enqueue(
    farmIdOrOptions: string | EnqueueOptions,
    tableName?: string,
    recordId?: string,
    operation?: 'INSERT' | 'UPDATE' | 'DELETE',
    payloadJson?: Record<string, unknown> | null,
    operationId?: string
  ): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    let farmId: string;
    let table: string;
    let recId: string;
    let op: 'INSERT' | 'UPDATE' | 'DELETE';
    let payload: Record<string, unknown> | null | undefined;
    let opId: string;

    if (typeof farmIdOrOptions === 'object') {
      farmId = farmIdOrOptions.farmId;
      table = farmIdOrOptions.tableName;
      recId = farmIdOrOptions.recordId;
      op = farmIdOrOptions.operation;
      payload = farmIdOrOptions.payloadJson;
      opId = farmIdOrOptions.operationId ?? generateUUID();
    } else {
      farmId = farmIdOrOptions;
      table = tableName!;
      recId = recordId!;
      op = operation!;
      payload = payloadJson;
      opId = operationId ?? generateUUID();
    }

    const id = generateUUID();

    await db.insert(schema.syncQueue).values({
      id,
      operationId: opId,
      farmId,
      tableName: table,
      recordId: recId,
      operation: op,
      payloadJson: payload ? JSON.stringify(payload) : null,
      status: 'pending',
      attempts: 0,
      nextRetryAt: null,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Espia um lote de registros pendentes elegíveis para envio.
   * Filtra por status ('pending' ou 'failed') e respeita backoff (nextRetryAt <= now).
   */
  static async peekBatch(
    farmId: string,
    limit: number = 50,
    now: Date = new Date()
  ): Promise<schema.SyncQueueEntry[]> {
    const db = getDatabase();
    const nowIso = now.toISOString();

    return db
      .select()
      .from(schema.syncQueue)
      .where(
        and(
          eq(schema.syncQueue.farmId, farmId),
          inArray(schema.syncQueue.status, ['pending', 'failed']),
          or(
            isNull(schema.syncQueue.nextRetryAt),
            lte(schema.syncQueue.nextRetryAt, nowIso)
          )
        )
      )
      .orderBy(asc(schema.syncQueue.createdAt))
      .limit(limit);
  }

  /**
   * Marca itens selecionados como 'in_flight' durante a transmissão.
   */
  static async markInFlight(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = getDatabase();
    const now = new Date().toISOString();

    await db
      .update(schema.syncQueue)
      .set({
        status: 'in_flight',
        updatedAt: now,
      })
      .where(inArray(schema.syncQueue.id, ids));
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
   * Alias semântico para confirmar envio concluído.
   */
  static async markCompleted(ids: string[]): Promise<void> {
    await this.removeBatch(ids);
  }

  /**
   * Registra uma falha de envio para controle de backoff exponencial.
   */
  static async recordFailure(
    id: string,
    errorMessage: string,
    retryDelayMs: number = 5000
  ): Promise<void> {
    const db = getDatabase();
    const existing = await db
      .select()
      .from(schema.syncQueue)
      .where(eq(schema.syncQueue.id, id))
      .limit(1);

    if (existing.length > 0) {
      const nextAttempts = existing[0].attempts + 1;
      const nextRetry = new Date(Date.now() + retryDelayMs).toISOString();
      const now = new Date().toISOString();

      await db
        .update(schema.syncQueue)
        .set({
          status: 'failed',
          attempts: nextAttempts,
          nextRetryAt: nextRetry,
          lastError: errorMessage,
          updatedAt: now,
        })
        .where(eq(schema.syncQueue.id, id));
    }
  }

  /**
   * Redefine itens travados em 'in_flight' de volta para 'pending'.
   * Essencial para recuperação em reinício do aplicativo ou após crash.
   */
  static async resetInFlight(farmId?: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const condition = farmId
      ? and(eq(schema.syncQueue.farmId, farmId), eq(schema.syncQueue.status, 'in_flight'))
      : eq(schema.syncQueue.status, 'in_flight');

    await db
      .update(schema.syncQueue)
      .set({
        status: 'pending',
        updatedAt: now,
      })
      .where(condition);
  }

  /**
   * Recupera todos os itens para inspeção ou testes.
   */
  static async getAll(farmId: string): Promise<schema.SyncQueueEntry[]> {
    const db = getDatabase();
    return db
      .select()
      .from(schema.syncQueue)
      .where(eq(schema.syncQueue.farmId, farmId))
      .orderBy(asc(schema.syncQueue.createdAt));
  }
}

export { OutboxRepository as SyncQueueRepository };
