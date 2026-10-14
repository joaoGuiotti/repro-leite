import { resolveProtectionStatus, getSyncStateDescription } from '@core/sync';

describe('Domain: syncState (Consolidação de Status de Proteção)', () => {
  test('resolveProtectionStatus deve priorizar syncing quando ativo', () => {
    expect(resolveProtectionStatus(5, true)).toBe('syncing');
  });

  test('resolveProtectionStatus deve retornar pending quando count > 0 e não estiver syncing', () => {
    expect(resolveProtectionStatus(3, false)).toBe('pending');
  });

  test('resolveProtectionStatus deve retornar protected quando count == 0 e sem erro', () => {
    expect(resolveProtectionStatus(0, false)).toBe('protected');
  });

  test('getSyncStateDescription deve retornar mensagens amigáveis corretas', () => {
    expect(getSyncStateDescription('protected')).toBe('Nuvem Protegida · Sincronizado agora');
    expect(getSyncStateDescription('pending', 1)).toBe('1 alteração pendente (Modo Curral)');
    expect(getSyncStateDescription('pending', 4)).toBe('4 alterações pendentes (Modo Curral)');
    expect(getSyncStateDescription('syncing')).toBe('Sincronizando com Supabase...');
  });
});
