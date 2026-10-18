import { eq, count, inArray, asc, and, or, isNull, lte } from 'drizzle-orm';
import { DEFAULT_FARM_ID, getDatabase, generateUUID } from '@core/db/client';
import * as schema from '@core/db/schema';

export type OutboxStatus = 'pending' | 'in_flight' | 'failed' | 'completed';

export type OutboxChangeListener = (event: { isEnqueue: boolean }) => void;

export interface EnqueueOptions {
  farmId: string;
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payloadJson?: Record<string, unknown> | null;
  operationId?: string;
}

function resolveTargetFarmIds(farmId?: string): string[] {
  if (!farmId || farmId === DEFAULT_FARM_ID) {
    return [DEFAULT_FARM_ID];
  }
  return [farmId, DEFAULT_FARM_ID];
}

export class OutboxRepository {
  private static _listeners: Set<OutboxChangeListener> = new Set();

  /**
   * Registra um listener que é disparado sempre que a fila sync_queue sofre mutação.
   */
  static addChangeListener(listener: OutboxChangeListener): () => void {
    OutboxRepository._listeners.add(listener);
    return () => {
      OutboxRepository._listeners.delete(listener);
    };
  }

  /**
   * Notifica todos os listeners registrados sobre alterações na outbox.
   */
  static notifyChange(event: { isEnqueue: boolean } = { isEnqueue: false }): void {
    for (const listener of OutboxRepository._listeners) {
      try {
        listener(event);
      } catch {
        // Ignora erro em listener individual
      }
    }
  }

  /**
   * Retorna a quantidade de alterações locais pendentes de sincronização
   * (status 'pending', 'in_flight' ou 'failed').
   */
  static async getPendingCount(farmId: string): Promise<number> {
    const db = getDatabase();
    const targetFarms = resolveTargetFarmIds(farmId);
    const farmCondition =
      targetFarms.length === 1
        ? eq(schema.syncQueue.farmId, targetFarms[0])
        : inArray(schema.syncQueue.farmId, targetFarms);

    const result = await db
      .select({ count: count() })
      .from(schema.syncQueue)
      .where(
        and(
          farmCondition,
          inArray(schema.syncQueue.status, ['pending', 'in_flight', 'failed'])
        )
      );

    return result[0]?.count ?? 0;
  }

  /**
   * Retorna os IDs dos registros (recordId) que possuem alterações pendentes na outbox.
   */
  static async getPendingRecordIds(farmId: string): Promise<string[]> {
    const db = getDatabase();
    const targetFarms = resolveTargetFarmIds(farmId);
    const farmCondition =
      targetFarms.length === 1
        ? eq(schema.syncQueue.farmId, targetFarms[0])
        : inArray(schema.syncQueue.farmId, targetFarms);

    const rows = await db
      .select({ recordId: schema.syncQueue.recordId })
      .from(schema.syncQueue)
      .where(
        and(
          farmCondition,
          inArray(schema.syncQueue.status, ['pending', 'in_flight', 'failed'])
        )
      );

    return Array.from(new Set(rows.map((r) => r.recordId)));
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

    OutboxRepository.notifyChange({ isEnqueue: true });
  }

  /**
   * Espia um lote de registros pendentes elegíveis para envio.
   * Filtra por status ('pending' ou 'failed') e respeita backoff (nextRetryAt <= now).
   */
  static async peekBatch(
    farmId: string,
    limit: number = 50,
    now: Date = new Date(),
    ignoreBackoff: boolean = false
  ): Promise<schema.SyncQueueEntry[]> {
    const db = getDatabase();
    const nowIso = now.toISOString();
    const targetFarms = resolveTargetFarmIds(farmId);
    const farmCondition =
      targetFarms.length === 1
        ? eq(schema.syncQueue.farmId, targetFarms[0])
        : inArray(schema.syncQueue.farmId, targetFarms);

    const conditions = [
      farmCondition,
      inArray(schema.syncQueue.status, ['pending', 'failed', 'in_flight']),
    ];

    if (!ignoreBackoff) {
      conditions.push(
        or(
          isNull(schema.syncQueue.nextRetryAt),
          lte(schema.syncQueue.nextRetryAt, nowIso)
        )!
      );
    }

    return db
      .select()
      .from(schema.syncQueue)
      .where(and(...conditions))
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
    OutboxRepository.notifyChange({ isEnqueue: false });
  }

  /**
   * Alias semântico para confirmar envio concluído.
   */
  static async markCompleted(ids: string[]): Promise<void> {
    await OutboxRepository.removeBatch(ids);
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

      OutboxRepository.notifyChange({ isEnqueue: false });
    }
  }

  /**
   * Redefine itens travados em 'in_flight' de volta para 'pending'.
   * Essencial para recuperação em reinício do aplicativo ou após crash.
   */
  static async resetInFlight(farmId?: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    let condition;
    if (farmId) {
      const targetFarms = resolveTargetFarmIds(farmId);
      const farmCondition =
        targetFarms.length === 1
          ? eq(schema.syncQueue.farmId, targetFarms[0])
          : inArray(schema.syncQueue.farmId, targetFarms);
      condition = and(farmCondition, eq(schema.syncQueue.status, 'in_flight'));
    } else {
      condition = eq(schema.syncQueue.status, 'in_flight');
    }

    await db
      .update(schema.syncQueue)
      .set({
        status: 'pending',
        updatedAt: now,
      })
      .where(condition);

    OutboxRepository.notifyChange({ isEnqueue: false });
  }

  /**
   * Recupera todos os itens para inspeção ou testes.
   */
  static async getAll(farmId: string): Promise<schema.SyncQueueEntry[]> {
    const db = getDatabase();
    const targetFarms = resolveTargetFarmIds(farmId);
    const farmCondition =
      targetFarms.length === 1
        ? eq(schema.syncQueue.farmId, targetFarms[0])
        : inArray(schema.syncQueue.farmId, targetFarms);

    return db
      .select()
      .from(schema.syncQueue)
      .where(farmCondition)
      .orderBy(asc(schema.syncQueue.createdAt));
  }
}

export { OutboxRepository as SyncQueueRepository };

