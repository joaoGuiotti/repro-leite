export type SyncProtectionState = 'protected' | 'pending' | 'syncing' | 'offline' | 'error';

/**
 * Determina o estado visual de proteção do app com base nas pendências e estado da rede.
 */
export function resolveProtectionStatus(
  pendingCount: number,
  isSyncing: boolean,
  hasError: boolean = false,
  isOnline: boolean = true
): SyncProtectionState {
  if (isSyncing) {
    return 'syncing';
  }
  if (!isOnline) {
    return 'offline';
  }
  if (hasError) {
    return 'error';
  }
  if (pendingCount > 0) {
    return 'pending';
  }
  return 'protected';
}

/**
 * Retorna uma mensagem amigável e legível para o produtor rural.
 */
export function getSyncStateDescription(
  status: SyncProtectionState,
  pendingCount: number = 0,
  lastSuccessDescription?: string
): string {
  switch (status) {
    case 'protected':
      return lastSuccessDescription
        ? `Nuvem Protegida · ${lastSuccessDescription}`
        : 'Nuvem Protegida · Sincronizado agora';
    case 'pending':
      return pendingCount === 1
        ? '1 alteração pendente (Modo Curral)'
        : `${pendingCount} alterações pendentes (Modo Curral)`;
    case 'syncing':
      return 'Sincronizando com Supabase...';
    case 'offline':
      return pendingCount > 0
        ? `${pendingCount} ${pendingCount === 1 ? 'alteração pendente' : 'alterações pendentes'} (Modo Curral Offline)`
        : 'Modo Curral Offline';
    case 'error':
      return pendingCount > 0
        ? `Falha na sincronização · ${pendingCount} ${pendingCount === 1 ? 'pendente' : 'pendentes'}`
        : 'Falha na sincronização';
  }
}

