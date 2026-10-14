import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type NetworkStatusListener = (isOnline: boolean) => void;

export class NetworkMonitor {
  private _isOnline: boolean = true;
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
          const online = Boolean(state.isConnected && (state.isInternetReachable ?? true));
          this.updateRealNetworkStatus(online);
        });

        // Verificação inicial
        if (typeof NetInfo.fetch === 'function') {
          NetInfo.fetch().then((state: NetInfoState) => {
            const online = Boolean(state.isConnected && (state.isInternetReachable ?? true));
            this.updateRealNetworkStatus(online);
          }).catch(() => {
            // Em caso de falha de consulta, presume online por padrão
          });
        }
      }
    } catch {
      // Ambiente Node / mock sem NetInfo
      this._isOnline = true;
    }
  }

  private updateRealNetworkStatus(online: boolean): void {
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
