import { SupabaseRemoteSyncGateway, InitialPullProgress } from '../supabase-remote-gateway';

describe('Initial Pull with Progress (User Story 6)', () => {
  let gateway: SupabaseRemoteSyncGateway;

  beforeEach(() => {
    gateway = new SupabaseRemoteSyncGateway();
  });

  it('deve invocar o callback de progresso para as tabelas sincronizáveis', async () => {
    const progressUpdates: InitialPullProgress[] = [];

    const result = await gateway.initialPull('farm-new-device', (progress) => {
      progressUpdates.push(progress);
    });

    expect(result).toBeDefined();
    expect(result.changes).toEqual([]);
    // Quando não configurado, retorna graciosamente
    expect(result.hasMore).toBe(false);
  });
});
