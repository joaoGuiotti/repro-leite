export type SyncProtectionState = 'protected' | 'pending' | 'syncing' | 'error';

/**
 * Determina o estado visual de proteção do app com base nas pendências e estado da rede.
 */
export function resolveProtectionStatus(
  pendingCount: number,
  isSyncing: boolean,
  hasError: boolean = false
): SyncProtectionState {
  if (isSyncing) {
    return 'syncing';
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
    case 'error':
      return 'Falha na sincronização';
  }
}
