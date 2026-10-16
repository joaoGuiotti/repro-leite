/**
 * Contrato de Transporte Remoto e Sincronização (Remote Gateway Port)
 * 
 * Define os métodos de comunicação bidirecional com a nuvem (Supabase)
 * mantendo o motor de sync agnóstico do provedor backend.
 */

import {
  RemoteOutboxItem,
  PushBatchResult,
  PullChangesQuery,
  PullChangesResult,
} from '@/core/network/api-client';

export interface ServerTimeCheckResult {
  serverTimeIso: string;
  driftSeconds: number;
  isClockDriftExceeded: boolean; // drift > 300s (5 min)
}

export interface InitialPullProgress {
  table: string;
  processedCount: number;
  totalCount: number;
  percentage: number;
}

export type InitialPullProgressCallback = (progress: InitialPullProgress) => void;

export interface RemoteSyncExtendedGateway {
  /**
   * Envia lote de mutações da outbox para persistência remota idempotente.
   */
  pushBatch(items: RemoteOutboxItem[]): Promise<PushBatchResult>;

  /**
   * Busca alterações remotas incrementais a partir do cursor temporal.
   */
  pullChanges(query: PullChangesQuery): Promise<PullChangesResult>;

  /**
   * Realiza a carga inicial completa em um dispositivo novo, reportando progresso.
   */
  initialPull(
    farmId: string,
    onProgress?: InitialPullProgressCallback
  ): Promise<PullChangesResult>;

  /**
   * Valida a sincronia do relógio do dispositivo com o servidor.
   */
  checkServerTimeDrift(): Promise<ServerTimeCheckResult>;
}
