import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type NetworkStatusListener = (isOnline: boolean) => void;

export interface NetworkStateSnapshot {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
}

export class NetworkMonitor {
  private _isOnline: boolean = true;
  private _isConnected: boolean | null = true;
  private _isInternetReachable: boolean | null = true;
  private _connectionType: string = 'unknown';
  private _isSimulatedOffline: boolean = false;
  private _listeners: Set<NetworkStatusListener> = new Set();
  private _unsubscribeNetInfo: (() => void) | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      if (NetInfo && typeof NetInfo.addEventListener === 'function') {
        this._unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
          this.updateFromNetInfoState(state);
        });

        // Verificação inicial
        if (typeof NetInfo.fetch === 'function') {
          NetInfo.fetch()
            .then((state: NetInfoState) => {
              this.updateFromNetInfoState(state);
            })
            .catch(() => {
              // Em caso de falha de consulta, presume online por padrão
            });
        }
      }
    } catch {
      // Ambiente Node / mock sem NetInfo
      this._isOnline = true;
      this._isConnected = true;
      this._isInternetReachable = true;
      this._connectionType = 'unknown';
    }
  }

  private updateFromNetInfoState(state: NetInfoState): void {
    this._connectionType = state.type ?? 'unknown';
    this._isConnected = state.isConnected ?? false;
    this._isInternetReachable = state.isInternetReachable ?? null;

    // Conectividade real funcional: deve estar conectado e não ter falha explícita de internet
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    this.updateRealNetworkStatus(online);
  }

  /**
   * Atualiza o estado da rede com base em informações recebidas (ex: via useNetInfo hook)
   */
  updateNetworkState(state: Partial<NetworkStateSnapshot>): void {
    if (state.type !== undefined) {
      this._connectionType = state.type;
    }
    if (state.isConnected !== undefined) {
      this._isConnected = state.isConnected;
    }
    if (state.isInternetReachable !== undefined) {
      this._isInternetReachable = state.isInternetReachable;
    }

    const online = Boolean(this._isConnected && this._isInternetReachable !== false);
    this.updateRealNetworkStatus(online);
  }

  /**
   * Atualiza o status booleano de rede física real.
   */
  updateRealNetworkStatus(online: boolean): void {
    if (this._isOnline !== online) {
      this._isOnline = online;
      if (!this._isSimulatedOffline) {
        this.notifyListeners();
      }
    }
  }

  /**
   * Retorna se a aplicação possui conectividade efetiva (rede real E não simulando offline).
   */
  isOnline(): boolean {
    if (this._isSimulatedOffline) {
      return false;
    }
    return this._isOnline;
  }

  /**
   * Retorna o tipo atual de interface de rede ('wifi', 'cellular', 'none', etc.)
   */
  getConnectionType(): string {
    return this._connectionType;
  }

  /**
   * Retorna se a interface de rede está fisicamente conectada
   */
  isConnected(): boolean | null {
    return this._isConnected;
  }

  /**
   * Retorna se a internet é realmente navegável
   */
  isInternetReachable(): boolean | null {
    return this._isInternetReachable;
  }

  /**
   * Retorna se o modo offline simulado está ativo.
   */
  isSimulatedOffline(): boolean {
    return this._isSimulatedOffline;
  }

  /**
   * Alterna ou define explicitamente o modo offline simulado (útil para testes em curral ou validação).
   */
  simulateOffline(simulate: boolean): void {
    if (this._isSimulatedOffline !== simulate) {
      this._isSimulatedOffline = simulate;
      this.notifyListeners();
    }
  }

  /**
   * Adiciona um ouvinte para alterações no estado de conectividade.
   */
  addListener(listener: NetworkStatusListener): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const online = this.isOnline();
    for (const listener of this._listeners) {
      try {
        listener(online);
      } catch {
        // Ignora erros de listeners individuais
      }
    }
  }

  /**
   * Limpeza de subscrições para teardown de testes.
   */
  destroy(): void {
    if (this._unsubscribeNetInfo) {
      this._unsubscribeNetInfo();
      this._unsubscribeNetInfo = null;
    }
    this._listeners.clear();
  }
}

export const networkMonitor = new NetworkMonitor();
