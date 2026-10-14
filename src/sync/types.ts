export type SyncStatus = 'ok' | 'pendente' | 'atrasado' | 'erro';

export interface SyncSummary {
  status: SyncStatus;
  pendingChanges: number;
  lastSuccessAt: string | null;
}

/** Cor do indicador: verde (ok), amarelo (pendente), vermelho (muitos dias sem sincronizar). */
export function computeSyncStatus(
  pendingChanges: number,
  lastSuccessAt: string | null,
  now: Date = new Date(),
  staleAfterDays = 7,
): SyncStatus {
  if (!lastSuccessAt) return 'atrasado';
  const days = (now.getTime() - new Date(lastSuccessAt).getTime()) / 86_400_000;
  if (days >= staleAfterDays) return 'atrasado';
  return pendingChanges > 0 ? 'pendente' : 'ok';
}
