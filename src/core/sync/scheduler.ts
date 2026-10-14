import { AppState, AppStateStatus } from 'react-native';
import { SyncEngine, syncEngine } from './sync-engine';
import { NetworkMonitor, networkMonitor } from '../network/network-monitor';

export interface SchedulerOptions {
  postWriteDebounceMs?: number;
  periodicIntervalMs?: number;
  engine?: SyncEngine;
  monitor?: NetworkMonitor;
}

export class SyncScheduler {
  private _engine: SyncEngine;
  private _monitor: NetworkMonitor;
  private _postWriteDebounceMs: number;
  private _periodicIntervalMs: number;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _periodicTimer: ReturnType<typeof setInterval> | null = null;
  private _appStateSubscription: { remove: () => void } | null = null;
  private _networkUnsubscribe: (() => void) | null = null;
  private _currentAppState: AppStateStatus = 'active';
  private _isRunning: boolean = false;

  constructor(options?: SchedulerOptions) {
    this._engine = options?.engine ?? syncEngine;
    this._monitor = options?.monitor ?? networkMonitor;
    this._postWriteDebounceMs = options?.postWriteDebounceMs ?? 1500;
    this._periodicIntervalMs = options?.periodicIntervalMs ?? 300000; // 5 minutos
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Inicia o agendador de sincronização automática.
   */
  start(): void {
    if (this._isRunning) return;
    this._isRunning = true;

    // 1. Escuta mudanças de conectividade (reconectou -> sincroniza)
    this._networkUnsubscribe = this._monitor.addListener((isOnline) => {
      if (isOnline && this._currentAppState === 'active') {
        this.triggerSync();
      }
    });

    // 2. Escuta mudanças de AppState (foi para foreground -> sincroniza)
    try {
      if (AppState && typeof AppState.addEventListener === 'function') {
        const sub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
          const cameToForeground =
            (this._currentAppState === 'background' || this._currentAppState === 'inactive') &&
            nextAppState === 'active';

          this._currentAppState = nextAppState;

          if (cameToForeground && this._monitor.isOnline()) {
            this.triggerSync();
          }
        });
        this._appStateSubscription = sub;
      }
    } catch {
      // Ignora erro em ambiente de teste sem AppState completo
    }

    // 3. Sincronização periódica quando em foreground e online
    this._periodicTimer = setInterval(() => {
      if (this._currentAppState === 'active' && this._monitor.isOnline()) {
        this.triggerSync();
      }
    }, this._periodicIntervalMs);
  }

  /**
   * Notifica que uma nova escrita local ocorreu, disparando uma sincronização
   * com debounce para agrupar operações rápidas em um único lote.
   */
  triggerPostWriteSync(): void {
    if (!this._isRunning) return;

    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null;
      if (this._monitor.isOnline()) {
        this.triggerSync();
      }
    }, this._postWriteDebounceMs);
  }

  /**
   * Dispara uma sincronização imediata através do engine.
   */
  async triggerSync(): Promise<void> {
    try {
      await this._engine.sync();
    } catch {
      // Falhas são registradas no SyncEngine com backoff nos itens da outbox
    }
  }

  /**
   * Encerra todos os timers e listeners.
   */
  stop(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }

    if (this._periodicTimer) {
      clearInterval(this._periodicTimer);
      this._periodicTimer = null;
    }

    if (this._networkUnsubscribe) {
      this._networkUnsubscribe();
      this._networkUnsubscribe = null;
    }

    if (this._appStateSubscription) {
      this._appStateSubscription.remove();
      this._appStateSubscription = null;
    }

    this._isRunning = false;
  }
}

export const syncScheduler = new SyncScheduler();
