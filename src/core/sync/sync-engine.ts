import { PushEngine, PushResult } from './push';
import { PullEngine, PullResult } from './pull';
import { OutboxRepository } from './outbox.repository';
import { RemoteSyncGateway, defaultRemoteGateway } from '../network/api-client';
import { supabaseRemoteGateway } from '../network/supabase-remote-gateway';
import { networkMonitor, NetworkMonitor } from '../network/network-monitor';
import { DEFAULT_FARM_ID, getDatabase } from '@core/db/client';
import { onTransactionCommitted } from '@core/db/transaction';
import * as schema from '@core/db/schema';
import { eq } from 'drizzle-orm';

export interface SyncEngineStatus {
  isSyncing: boolean;
  pendingCount: number;
  pendingRecordIds: string[];
  lastSuccessAt: string | null;
  lastError: string | null;
  isOnline: boolean;
}

export type SyncEngineListener = (status: SyncEngineStatus) => void;

export class SyncEngine {
  private _gateway: RemoteSyncGateway;
  private _networkMonitor: NetworkMonitor;
  private _isSyncing: boolean = false;
  private _lastError: string | null = null;
  private _lastSuccessAt: string | null = null;
  private _pendingCount: number = 0;
  private _pendingRecordIds: string[] = [];
  private _listeners: Set<SyncEngineListener> = new Set();
  private _farmId: string;
  private _outboxUnsubscribe: (() => void) | null = null;
  private _txUnsubscribe: (() => void) | null = null;

  constructor(
    gateway: RemoteSyncGateway = defaultRemoteGateway,
    monitor: NetworkMonitor = networkMonitor,
    farmId: string = DEFAULT_FARM_ID
  ) {
    this._gateway = gateway;
    this._networkMonitor = monitor;
    this._farmId = farmId;
    this.bindOutboxListeners();
  }

  private bindOutboxListeners(): void {
    if (!this._outboxUnsubscribe) {
      this._outboxUnsubscribe = OutboxRepository.addChangeListener(() => {
        void this.refreshPendingCount();
      });
    }
    if (!this._txUnsubscribe) {
      this._txUnsubscribe = onTransactionCommitted(() => {
        void this.refreshPendingCount();
      });
    }
  }

  get isSyncing(): boolean {
    return this._isSyncing;
  }

  get lastError(): string | null {
    return this._lastError;
  }

  get lastSuccessAt(): string | null {
    return this._lastSuccessAt;
  }

  get pendingCount(): number {
    return this._pendingCount;
  }

  get pendingRecordIds(): string[] {
    return this._pendingRecordIds;
  }

  get gateway(): RemoteSyncGateway {
    return this._gateway;
  }

  setGateway(gateway: RemoteSyncGateway): void {
    this._gateway = gateway;
  }

  get farmId(): string {
    return this._farmId;
  }

  setFarmId(farmId: string): void {
    if (this._farmId !== farmId) {
      this._farmId = farmId;
      void this.refreshPendingCount();
      void this.loadLastSuccessAt();
    }
  }

  useSupabaseGateway(): void {
    this.setGateway(supabaseRemoteGateway);
  }

  /**
   * Inicializa o motor de sync, recuperando itens in-flight travados e lendo cursores.
   */
  async initialize(): Promise<void> {
    this.bindOutboxListeners();
    try {
      await OutboxRepository.resetInFlight(this._farmId);
      await this.refreshPendingCount();
      await this.loadLastSuccessAt();
    } catch {
      // Ignora erro se DB ainda não inicializado
    }
  }

  /**
   * Atualiza a contagem e os IDs de itens pendentes na outbox.
   */
  async refreshPendingCount(): Promise<number> {
    try {
      const count = await OutboxRepository.getPendingCount(this._farmId);
      this._pendingCount = count;
      try {
        if (typeof OutboxRepository.getPendingRecordIds === 'function') {
          this._pendingRecordIds = await OutboxRepository.getPendingRecordIds(this._farmId);
        }
      } catch {
        // Ignora caso getPendingRecordIds não esteja disponível em mock de teste
      }
      this.notifyListeners();
      return count;
    } catch {
      return 0;
    }
  }

  private async loadLastSuccessAt(): Promise<void> {
    try {
      const db = getDatabase();
      const state = await db
        .select()
        .from(schema.syncState)
        .where(eq(schema.syncState.farmId, this._farmId))
        .limit(1);

      if (state.length > 0 && state[0].lastSuccessAt) {
        this._lastSuccessAt = state[0].lastSuccessAt;
      }
    } catch {
      // Ignora erro de leitura inicial
    }
  }

  /**
   * Executa um ciclo completo de sincronização (Push seguido de Pull).
   * Garante execução única (lock de concorrência) e respeita estado offline.
   */
  async sync(options?: { farmId?: string; force?: boolean }): Promise<{
    pushResult: PushResult;
    pullResult: PullResult;
  }> {
    const targetFarm = options?.farmId ?? this._farmId;

    if (this._isSyncing) {
      return {
        pushResult: { pushedCount: 0, failedCount: 0, hasMore: false },
        pullResult: { pulledCount: 0, newRev: 0, hasMore: false },
      };
    }

    if (!this._networkMonitor.isOnline() && !options?.force) {
      await this.refreshPendingCount();
      return {
        pushResult: { pushedCount: 0, failedCount: 0, hasMore: false },
        pullResult: { pulledCount: 0, newRev: 0, hasMore: false },
      };
    }

    this._isSyncing = true;
    this._lastError = null;
    this.notifyListeners();

    let pushTotal = 0;
    let pushFailed = 0;
    let lastPushHasMore = false;

    let pullTotal = 0;
    let newRev = 0;
    let lastPullHasMore = false;

    try {
      // 1. PUSH: Drena outbox local em lotes de até 50 itens
      let pushLoops = 0;
      do {
        const pushRes = await PushEngine.push(targetFarm, this._gateway, 50, new Date(), options?.force ?? false);
        pushTotal += pushRes.pushedCount;
        pushFailed += pushRes.failedCount;
        lastPushHasMore = pushRes.hasMore;
        pushLoops++;
      } while (lastPushHasMore && pushLoops < 5);

      // 2. PULL: Busca atualizações remotas desde o último cursor
      let pullLoops = 0;
      do {
        const pullRes = await PullEngine.pull(targetFarm, this._gateway, 100);
        pullTotal += pullRes.pulledCount;
        newRev = pullRes.newRev;
        lastPullHasMore = pullRes.hasMore;
        pullLoops++;
      } while (lastPullHasMore && pullLoops < 5);

      if (pushFailed === 0) {
        this._lastSuccessAt = new Date().toISOString();
      }
      await this.refreshPendingCount();

      return {
        pushResult: { pushedCount: pushTotal, failedCount: pushFailed, hasMore: lastPushHasMore },
        pullResult: { pulledCount: pullTotal, newRev, hasMore: lastPullHasMore },
      };
    } catch (err: unknown) {
      console.error('[SyncEngine Error]:', err);
      this._lastError = err instanceof Error ? err.message : String(err);
      await this.refreshPendingCount();
      throw err;
    } finally {
      this._isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Adiciona um ouvinte para alterações no estado do motor de sync.
   */
  addListener(listener: SyncEngineListener): () => void {
    this._listeners.add(listener);
    // Dispara imediatamente o estado atual
    listener(this.getStatus());
    return () => {
      this._listeners.delete(listener);
    };
  }

  getStatus(): SyncEngineStatus {
    return {
      isSyncing: this._isSyncing,
      pendingCount: this._pendingCount,
      pendingRecordIds: this._pendingRecordIds,
      lastSuccessAt: this._lastSuccessAt,
      lastError: this._lastError,
      isOnline: this._networkMonitor.isOnline(),
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    for (const listener of this._listeners) {
      try {
        listener(status);
      } catch {
        // Ignora erros individuais de listeners
      }
    }
  }
}

export const syncEngine = new SyncEngine(supabaseRemoteGateway);


