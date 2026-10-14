export interface RemoteOutboxItem {
  operationId: string;
  farmId: string;
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface FailedOperation {
  operationId: string;
  error: string;
  permanent?: boolean;
}

export interface PushBatchResult {
  success: boolean;
  processedOperationIds: string[];
  failedOperations?: FailedOperation[];
}

export interface RemoteRecordChange {
  id: string;
  farmId: string;
  tableName: string;
  recordId: string;
  data: Record<string, unknown>;
  serverRev: number;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PullChangesQuery {
  farmId: string;
  sinceRev?: number;
  sinceTimestamp?: string | null;
  limit?: number;
}

export interface PullChangesResult {
  changes: RemoteRecordChange[];
  newRev: number;
  hasMore: boolean;
}

export interface RemoteSyncGateway {
  pushBatch(items: RemoteOutboxItem[]): Promise<PushBatchResult>;
  pullChanges(query: PullChangesQuery): Promise<PullChangesResult>;
}

/**
 * Implementação Fake do RemoteSyncGateway para modo offline-first,
 * demonstrações locais e suítes de testes unitários/integração sem Supabase.
 */
export class FakeRemoteSyncGateway implements RemoteSyncGateway {
  private _records: Map<string, Map<string, RemoteRecordChange>> = new Map();
  private _processedOperationIds: Set<string> = new Set();
  private _currentRev: number = 1;
  private _shouldFailPush: boolean = false;
  private _shouldFailPull: boolean = false;
  private _failError: string = 'Network request failed';

  constructor() {
    this._records.set('animals', new Map());
    this._records.set('bulls', new Map());
    this._records.set('inseminations', new Map());
    this._records.set('alerts', new Map());
    this._records.set('settings', new Map());
  }

  setShouldFailPush(fail: boolean, errorMessage?: string): void {
    this._shouldFailPush = fail;
    if (errorMessage) this._failError = errorMessage;
  }

  setShouldFailPull(fail: boolean, errorMessage?: string): void {
    this._shouldFailPull = fail;
    if (errorMessage) this._failError = errorMessage;
  }

  isOperationProcessed(operationId: string): boolean {
    return this._processedOperationIds.has(operationId);
  }

  getProcessedOperationIds(): string[] {
    return Array.from(this._processedOperationIds);
  }

  /**
   * Adiciona ou atualiza manualmente um registro remoto para simular alterações
   * vindas de outro dispositivo ou servidor na nuvem.
   */
  seedRemoteRecord(
    tableName: string,
    recordId: string,
    farmId: string,
    data: Record<string, unknown>,
    updatedAt: string = new Date().toISOString(),
    deletedAt: string | null = null
  ): void {
    let table = this._records.get(tableName);
    if (!table) {
      table = new Map();
      this._records.set(tableName, table);
    }

    this._currentRev += 1;
    table.set(recordId, {
      id: recordId,
      farmId,
      tableName,
      recordId,
      data,
      serverRev: this._currentRev,
      updatedAt,
      deletedAt,
    });
  }

  async pushBatch(items: RemoteOutboxItem[]): Promise<PushBatchResult> {
    if (this._shouldFailPush) {
      throw new Error(this._failError);
    }

    const processedOperationIds: string[] = [];
    const failedOperations: FailedOperation[] = [];

    for (const item of items) {
      // Idempotência: se a operação já foi processada anteriormente,
      // confirma sem duplicar efeitos
      if (this._processedOperationIds.has(item.operationId)) {
        processedOperationIds.push(item.operationId);
        continue;
      }

      try {
        let table = this._records.get(item.tableName);
        if (!table) {
          table = new Map();
          this._records.set(item.tableName, table);
        }

        this._currentRev += 1;

        if (item.operation === 'DELETE') {
          const existing = table.get(item.recordId);
          table.set(item.recordId, {
            id: item.recordId,
            farmId: item.farmId,
            tableName: item.tableName,
            recordId: item.recordId,
            data: existing ? existing.data : {},
            serverRev: this._currentRev,
            updatedAt: item.createdAt,
            deletedAt: item.createdAt,
          });
        } else {
          table.set(item.recordId, {
            id: item.recordId,
            farmId: item.farmId,
            tableName: item.tableName,
            recordId: item.recordId,
            data: item.payload ?? {},
            serverRev: this._currentRev,
            updatedAt: item.createdAt,
            deletedAt: null,
          });
        }

        this._processedOperationIds.add(item.operationId);
        processedOperationIds.push(item.operationId);
      } catch (err: unknown) {
        failedOperations.push({
          operationId: item.operationId,
          error: err instanceof Error ? err.message : String(err),
          permanent: false,
        });
      }
    }

    return {
      success: failedOperations.length === 0,
      processedOperationIds,
      failedOperations: failedOperations.length > 0 ? failedOperations : undefined,
    };
  }

  async pullChanges(query: PullChangesQuery): Promise<PullChangesResult> {
    if (this._shouldFailPull) {
      throw new Error(this._failError);
    }

    const sinceRev = query.sinceRev ?? 0;
    const sinceTimestamp = query.sinceTimestamp ? new Date(query.sinceTimestamp).getTime() : 0;
    const limit = query.limit ?? 100;

    const matchedChanges: RemoteRecordChange[] = [];

    for (const [, tableMap] of this._records.entries()) {
      for (const record of tableMap.values()) {
        if (record.farmId !== query.farmId) continue;

        const isRevNewer = record.serverRev > sinceRev;
        const isTimeNewer = sinceTimestamp > 0 && new Date(record.updatedAt).getTime() > sinceTimestamp;

        if (isRevNewer || isTimeNewer) {
          matchedChanges.push(record);
        }
      }
    }

    matchedChanges.sort((a, b) => a.serverRev - b.serverRev);

    const paginated = matchedChanges.slice(0, limit);
    const hasMore = matchedChanges.length > limit;
    const highestRev = paginated.length > 0
      ? Math.max(...paginated.map((c) => c.serverRev), sinceRev)
      : sinceRev;

    return {
      changes: paginated,
      newRev: highestRev,
      hasMore,
    };
  }
}

export const defaultRemoteGateway = new FakeRemoteSyncGateway();
