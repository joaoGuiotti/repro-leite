import { SupabaseRemoteSyncGateway } from '../supabase-remote-gateway';
import { RemoteOutboxItem } from '../api-client';

describe('SupabaseRemoteSyncGateway (User Story 3)', () => {
  let gateway: SupabaseRemoteSyncGateway;

  beforeEach(() => {
    gateway = new SupabaseRemoteSyncGateway();
  });

  it('deve retornar sucesso com lista de IDs para batch vazio', async () => {
    const res = await gateway.pushBatch([]);
    expect(res.success).toBe(true);
    expect(res.processedOperationIds).toEqual([]);
  });

  it('deve processar itens graciosamente em ambiente sem credenciais configuradas', async () => {
    const items: RemoteOutboxItem[] = [
      {
        operationId: 'op-1',
        farmId: 'farm-1',
        tableName: 'animals',
        recordId: 'anim-1',
        operation: 'INSERT',
        payload: { ear_tag: '101' },
        createdAt: new Date().toISOString(),
      },
      {
        operationId: 'op-2',
        farmId: 'farm-1',
        tableName: 'animals',
        recordId: 'anim-1',
        operation: 'DELETE',
        payload: null,
        createdAt: new Date().toISOString(),
      },
    ];

    const pushRes = await gateway.pushBatch(items);
    expect(pushRes.success).toBe(true);
    expect(pushRes.processedOperationIds).toContain('op-1');
    expect(pushRes.processedOperationIds).toContain('op-2');
  });

  it('deve retornar array vazio de alterações no pull sem supabase configurado', async () => {
    const pullRes = await gateway.pullChanges({
      farmId: 'farm-1',
      sinceRev: 0,
      limit: 50,
    });

    expect(pullRes.changes).toEqual([]);
    expect(pullRes.newRev).toBe(0);
    expect(pullRes.hasMore).toBe(false);
  });

  it('deve verificar defasagem de relógio retornando status e drift em segundos', async () => {
    const driftRes = await gateway.checkServerTimeDrift();
    expect(typeof driftRes.driftSeconds).toBe('number');
    expect(typeof driftRes.isClockDriftExceeded).toBe('boolean');
    expect(typeof driftRes.serverTimeIso).toBe('string');
  });
});
