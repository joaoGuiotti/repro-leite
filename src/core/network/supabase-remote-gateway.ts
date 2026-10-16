import {
  RemoteSyncGateway,
  RemoteOutboxItem,
  PushBatchResult,
  PullChangesQuery,
  PullChangesResult,
  RemoteRecordChange,
  FailedOperation,
} from './api-client';
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from './supabase-client';

export interface ServerTimeCheckResult {
  serverTimeIso: string;
  driftSeconds: number;
  isClockDriftExceeded: boolean;
}

export interface InitialPullProgress {
  table: string;
  processedCount: number;
  totalCount: number;
  percentage: number;
}

export type InitialPullProgressCallback = (progress: InitialPullProgress) => void;

const SYNCABLE_TABLES = [
  'animals',
  'bulls',
  'inseminations',
  'weighings',
  'alerts',
  'settings',
] as const;

export class SupabaseRemoteSyncGateway implements RemoteSyncGateway {
  private client = getSupabaseClient();

  async pushBatch(items: RemoteOutboxItem[]): Promise<PushBatchResult> {
    if (!isSupabaseConfigured() || items.length === 0) {
      return {
        success: true,
        processedOperationIds: items.map((i) => i.operationId),
      };
    }

    const processedOperationIds: string[] = [];
    const failedOperations: FailedOperation[] = [];

    // Garante que o farm existe na nuvem antes de tentar gravar tabelas filhas (animals, etc)
    if (items.length > 0 && items[0].farmId) {
      try {
        await this.client.rpc('sync_bootstrap_farm', { p_local_farm_id: items[0].farmId });
      } catch {
        // Ignora caso já exista ou não autenticado
      }
    }

    for (const item of items) {
      try {
        if (item.operation === 'DELETE') {
          const { error } = await this.client
            .from(item.tableName)
            .update({
              deleted_at: item.createdAt,
              updated_at: item.createdAt,
            })
            .eq('id', item.recordId)
            .eq('farm_id', item.farmId);

          if (error) {
            failedOperations.push({
              operationId: item.operationId,
              error: error.message,
            });
          } else {
            processedOperationIds.push(item.operationId);
          }
        } else {
          // INSERT ou UPDATE (Upsert)
          const payload = item.payload || {};
          const snakePayload: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(payload)) {
            const snakeKey = k.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
            snakePayload[snakeKey] = v;
          }

          const recordToSave = {
            id: item.recordId,
            farm_id: item.farmId,
            ...snakePayload,
            updated_at: item.createdAt,
          };

          const { error } = await this.client
            .from(item.tableName)
            .upsert(recordToSave, { onConflict: 'id' });

          if (error) {
            console.warn(`[Sync Push Error] ${item.tableName}/${item.recordId}:`, error.message);
            failedOperations.push({
              operationId: item.operationId,
              error: error.message,
            });
          } else {
            processedOperationIds.push(item.operationId);
          }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Falha ao sincronizar registro';
        failedOperations.push({
          operationId: item.operationId,
          error: errorMsg,
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
    if (!isSupabaseConfigured()) {
      return {
        changes: [],
        newRev: query.sinceRev || 0,
        hasMore: false,
      };
    }

    const allChanges: RemoteRecordChange[] = [];
    let maxRev = query.sinceRev || 0;
    const limitPerTable = Math.max(10, Math.floor((query.limit || 100) / SYNCABLE_TABLES.length));

    for (const table of SYNCABLE_TABLES) {
      try {
        let req = this.client
          .from(table)
          .select('*')
          .eq('farm_id', query.farmId)
          .order('updated_at', { ascending: true })
          .limit(limitPerTable);

        if (query.sinceTimestamp) {
          req = req.gt('updated_at', query.sinceTimestamp);
        }

        const { data, error } = await req;
        if (!error && Array.isArray(data)) {
          for (const row of data) {
            const rowRev = typeof row.server_rev === 'number' ? row.server_rev : 0;
            if (rowRev > maxRev) {
              maxRev = rowRev;
            }

            allChanges.push({
              id: row.id,
              farmId: row.farm_id,
              tableName: table,
              recordId: row.id,
              data: row,
              serverRev: rowRev,
              updatedAt: row.updated_at || new Date().toISOString(),
              deletedAt: row.deleted_at || null,
            });
          }
        }
      } catch {
        // Continua com as demais tabelas em caso de falha transitória
      }
    }

    return {
      changes: allChanges,
      newRev: maxRev,
      hasMore: allChanges.length >= (query.limit || 100),
    };
  }

  async initialPull(
    farmId: string,
    onProgress?: InitialPullProgressCallback
  ): Promise<PullChangesResult> {
    if (!isSupabaseConfigured()) {
      return { changes: [], newRev: 0, hasMore: false };
    }

    const allChanges: RemoteRecordChange[] = [];
    const totalTables = SYNCABLE_TABLES.length;
    let tablesCompleted = 0;
    let maxRev = 0;

    for (const table of SYNCABLE_TABLES) {
      try {
        const { data, error } = await this.client
          .from(table)
          .select('*')
          .eq('farm_id', farmId);

        if (!error && Array.isArray(data)) {
          for (const row of data) {
            const rowRev = typeof row.server_rev === 'number' ? row.server_rev : 0;
            if (rowRev > maxRev) {
              maxRev = rowRev;
            }

            allChanges.push({
              id: row.id,
              farmId: row.farm_id,
              tableName: table,
              recordId: row.id,
              data: row,
              serverRev: rowRev,
              updatedAt: row.updated_at || new Date().toISOString(),
              deletedAt: row.deleted_at || null,
            });
          }
        }
      } catch {
        // Ignora tabela indisponível
      }

      tablesCompleted++;
      if (onProgress) {
        onProgress({
          table,
          processedCount: allChanges.length,
          totalCount: totalTables,
          percentage: Math.round((tablesCompleted / totalTables) * 100),
        });
      }
    }

    return {
      changes: allChanges,
      newRev: maxRev,
      hasMore: false,
    };
  }

  async checkServerTimeDrift(): Promise<ServerTimeCheckResult> {
    const clientTime = Date.now();
    let serverTimeIso = new Date().toISOString();
    let driftSeconds = 0;

    try {
      if (isSupabaseConfigured()) {
        const start = Date.now();
        // Ping leve para capturar cabeçalho Date do servidor
        const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
          method: 'GET',
        });
        const serverDateHeader = res.headers.get('date');
        if (serverDateHeader) {
          const serverEpoch = new Date(serverDateHeader).getTime();
          const latency = (Date.now() - start) / 2;
          const adjustedServerEpoch = serverEpoch + latency;
          driftSeconds = Math.round(Math.abs(clientTime - adjustedServerEpoch) / 1000);
          serverTimeIso = new Date(adjustedServerEpoch).toISOString();
        }
      }
    } catch {
      // Em offline ou erro, presume drift aceitável
      driftSeconds = 0;
    }

    return {
      serverTimeIso,
      driftSeconds,
      isClockDriftExceeded: driftSeconds > 300, // > 5 minutos
    };
  }
}

export const supabaseRemoteGateway = new SupabaseRemoteSyncGateway();
