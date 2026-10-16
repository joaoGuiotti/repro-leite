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

    // Verifica se há sessão autenticada antes de tentar o push no Supabase
    const { data: sessionData } = await this.client.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id ?? null;

    if (!currentUserId) {
      return {
        success: false,
        processedOperationIds: [],
        failedOperations: items.map((it) => ({
          operationId: it.operationId,
          error: 'Sessão não autenticada no Supabase. Aguardando login para enviar dados.',
        })),
      };
    }

    // Garante que o farm existe na nuvem antes de tentar gravar tabelas filhas (animals, etc)
    if (items.length > 0 && items[0].farmId) {
      try {
        await this.client.rpc('sync_bootstrap_farm', { p_local_farm_id: items[0].farmId });
      } catch {
        // Ignora caso já exista
      }
    }

    // Ordena os itens para garantir que entidades pai (farms, bulls, animals)
    // sejam enviadas antes das entidades dependentes (inseminations, weighings, alerts)
    const TABLE_PRECEDENCE: Record<string, number> = {
      farms: 1,
      bulls: 2,
      animals: 3,
      settings: 4,
      inseminations: 5,
      weighings: 6,
      alerts: 7,
    };

    const sortedItems = [...items].sort((a, b) => {
      const precA = TABLE_PRECEDENCE[a.tableName] ?? 99;
      const precB = TABLE_PRECEDENCE[b.tableName] ?? 99;
      if (a.operation === 'DELETE' && b.operation === 'DELETE') {
        return precB - precA; // Filhos deletados antes dos pais
      }
      return precA - precB; // Pais criados antes dos filhos
    });

    for (const item of sortedItems) {
      try {
        if (item.operation === 'DELETE') {
          let query = this.client
            .from(item.tableName)
            .update({
              deleted_at: item.createdAt,
              updated_at: item.createdAt,
            })
            .eq('id', item.recordId);

          // A tabela 'farms' não possui coluna 'farm_id'
          if (item.tableName !== 'farms') {
            query = query.eq('farm_id', item.farmId);
          }

          const { error } = await query;

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

          let error: { message: string } | null = null;

          if (item.tableName === 'farms') {
            // Tabela 'farms': atualiza nome e metadados via UPDATE
            const farmUpdatePayload: Record<string, unknown> = {
              ...snakePayload,
              updated_at: item.createdAt,
            };
            delete farmUpdatePayload.id;
            delete farmUpdatePayload.farm_id;
            delete farmUpdatePayload.owner_user_id;

            const updateRes = await this.client
              .from('farms')
              .update(farmUpdatePayload)
              .eq('id', item.recordId)
              .select('id');

            if (updateRes.error) {
              error = updateRes.error;
            } else if (!updateRes.data || updateRes.data.length === 0) {
              // Se a fazenda não foi atualizada diretamente (ex.: id local diferente ou não criada ainda),
              // invoca sync_bootstrap_farm para provisionar/obter a fazenda do usuário.
              try {
                const { data: bootData, error: bootError } = await this.client.rpc(
                  'sync_bootstrap_farm',
                  { p_local_farm_id: item.recordId }
                );

                if (bootError) {
                  error = bootError;
                } else {
                  const targetFarmId =
                    bootData && typeof bootData === 'object' && 'farm_id' in bootData
                      ? (bootData as { farm_id: string }).farm_id
                      : item.recordId;

                  const retryUpdate = await this.client
                    .from('farms')
                    .update(farmUpdatePayload)
                    .eq('id', targetFarmId);

                  if (retryUpdate.error) {
                    error = retryUpdate.error;
                  }
                }
              } catch (rpcErr: unknown) {
                error = {
                  message: rpcErr instanceof Error ? rpcErr.message : 'Falha ao sincronizar fazenda',
                };
              }
            }
          } else {
            // Demais tabelas (animals, bulls, inseminations, settings, etc.)
            const recordToSave: Record<string, unknown> = {
              id: item.recordId,
              farm_id: item.farmId,
              ...snakePayload,
              updated_at: item.createdAt,
            };

            // Normaliza UUIDs vazios para null para evitar erro de sintaxe ou violação de FK no Postgres
            if (recordToSave.bull_id === '') recordToSave.bull_id = null;
            if (recordToSave.dam_id === '') recordToSave.dam_id = null;
            if (recordToSave.sire_id === '') recordToSave.sire_id = null;
            if (recordToSave.animal_id === '') recordToSave.animal_id = null;

            const upsertRes = await this.client
              .from(item.tableName)
              .upsert(recordToSave, { onConflict: 'id' });
            error = upsertRes.error;

            // Fallback para inseminações caso o bull_id referenciado não exista na nuvem
            if (error && item.tableName === 'inseminations' && error.message.includes('inseminations_bull_id_fkey')) {
              console.warn(
                `[Sync Push Fallback] Touro referenciado (${recordToSave.bull_id}) ausente na nuvem para a inseminação ${item.recordId}. Salvando com bull_id nulo para preservar dados reprodutivos da vaca.`
              );
              const fallbackRecord = { ...recordToSave, bull_id: null };
              const fallbackRes = await this.client
                .from('inseminations')
                .upsert(fallbackRecord, { onConflict: 'id' });
              error = fallbackRes.error;
            }
          }

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

    // 1. Puxa a fazenda ativa (na tabela farms o filtro é 'id', não 'farm_id', e não deve filtrar timestamp para garantir atualização imediata)
    try {
      let farmReq = this.client
        .from('farms')
        .select('*')
        .limit(1);

      if (query.farmId) {
        farmReq = farmReq.eq('id', query.farmId);
      }

      const { data: farmData, error: farmError } = await farmReq;
      if (!farmError && Array.isArray(farmData) && farmData.length > 0) {
        const farmRow = farmData[0];
        allChanges.push({
          id: farmRow.id,
          farmId: farmRow.id,
          tableName: 'farms',
          recordId: farmRow.id,
          data: farmRow,
          serverRev: 0,
          updatedAt: farmRow.updated_at || new Date().toISOString(),
          deletedAt: farmRow.deleted_at || null,
        });
      } else if (!farmError && (!farmData || farmData.length === 0)) {
        // Se não encontrou pelo farmId local (ex: ainda era DEFAULT_FARM_ID no cliente),
        // busca a fazenda do usuário pelo RLS
        const { data: userFarms } = await this.client
          .from('farms')
          .select('*')
          .limit(1);

        if (userFarms && Array.isArray(userFarms) && userFarms.length > 0) {
          const farmRow = userFarms[0];
          allChanges.push({
            id: farmRow.id,
            farmId: farmRow.id,
            tableName: 'farms',
            recordId: farmRow.id,
            data: farmRow,
            serverRev: 0,
            updatedAt: farmRow.updated_at || new Date().toISOString(),
            deletedAt: farmRow.deleted_at || null,
          });
        }
      }
    } catch {
      // Continua com as demais tabelas em caso de falha transitória
    }

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
    const totalTables = SYNCABLE_TABLES.length + 1;
    let tablesCompleted = 0;
    let maxRev = 0;

    // Puxa a fazenda na carga inicial
    try {
      let { data: farmData } = await this.client
        .from('farms')
        .select('*')
        .eq('id', farmId)
        .limit(1);

      if (!farmData || farmData.length === 0) {
        const { data: userFarms } = await this.client
          .from('farms')
          .select('*')
          .limit(1);
        farmData = userFarms;
      }

      if (farmData && farmData.length > 0) {
        const farmRow = farmData[0];
        allChanges.push({
          id: farmRow.id,
          farmId: farmRow.id,
          tableName: 'farms',
          recordId: farmRow.id,
          data: farmRow,
          serverRev: 0,
          updatedAt: farmRow.updated_at || new Date().toISOString(),
          deletedAt: farmRow.deleted_at || null,
        });
      }
    } catch {
      // Ignora erro transitório
    }

    tablesCompleted++;
    if (onProgress) {
      onProgress({
        table: 'farms',
        processedCount: allChanges.length,
        totalCount: totalTables,
        percentage: Math.round((tablesCompleted / totalTables) * 100),
      });
    }

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
