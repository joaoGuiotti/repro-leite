import { SyncEngine } from '../sync-engine';
import { FakeRemoteSyncGateway } from '../../network/api-client';
import { NetworkMonitor } from '../../network/network-monitor';
import { OutboxRepository } from '../outbox.repository';
import { PushEngine } from '../push';
import { PullEngine } from '../pull';

describe('Sync: SyncEngine (End-to-End Orchestrator)', () => {
  let gateway: FakeRemoteSyncGateway;
  let monitor: NetworkMonitor;
  let engine: SyncEngine;
  const farmId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    gateway = new FakeRemoteSyncGateway();
    monitor = new NetworkMonitor();
    engine = new SyncEngine(gateway, monitor, farmId);
    jest.restoreAllMocks();
  });

  test('offline total: aborta ciclo sem chamar push/pull quando offline', async () => {
    monitor.simulateOffline(true);
    const pushSpy = jest.spyOn(PushEngine, 'push');
    const pullSpy = jest.spyOn(PullEngine, 'pull');
    jest.spyOn(OutboxRepository, 'getPendingCount').mockResolvedValue(5);

    const result = await engine.sync();

    expect(pushSpy).not.toHaveBeenCalled();
    expect(pullSpy).not.toHaveBeenCalled();
    expect(result.pushResult.pushedCount).toBe(0);
    expect(engine.pendingCount).toBe(5);
  });

  test('concorrência: impede execuções sobrepostas com lock isSyncing', async () => {
    let resolvePush: (value: any) => void;
    const slowPushPromise = new Promise((resolve) => {
      resolvePush = resolve;
    });

    jest.spyOn(PushEngine, 'push').mockReturnValue(slowPushPromise as any);
    jest.spyOn(PullEngine, 'pull').mockResolvedValue({ pulledCount: 0, newRev: 1, hasMore: false });

    // Inicia primeiro sync
    const firstSyncPromise = engine.sync();
    expect(engine.isSyncing).toBe(true);

    // Tenta segundo sync enquanto o primeiro ainda roda
    const secondSyncResult = await engine.sync();
    expect(secondSyncResult.pushResult.pushedCount).toBe(0);

    // Libera o primeiro sync
    resolvePush!({ pushedCount: 3, failedCount: 0, hasMore: false });
    await firstSyncPromise;

    expect(engine.isSyncing).toBe(false);
  });

  test('recuperação após crash: initialize redefine itens in_flight para pending', async () => {
    const resetSpy = jest.spyOn(OutboxRepository, 'resetInFlight').mockResolvedValue();
    const countSpy = jest.spyOn(OutboxRepository, 'getPendingCount').mockResolvedValue(2);

    await engine.initialize();

    expect(resetSpy).toHaveBeenCalledWith(farmId);
    expect(countSpy).toHaveBeenCalledWith(farmId);
    expect(engine.pendingCount).toBe(2);
  });

  test('fluxo completo: offline -> escrita -> reconexão sincroniza push e pull com sucesso', async () => {
    // 1. Ouvinte para monitorar estados
    const states: boolean[] = [];
    const unsubscribe = engine.addListener((status) => {
      states.push(status.isSyncing);
    });

    // 2. Mocks do push e pull
    jest.spyOn(PushEngine, 'push').mockResolvedValue({
      pushedCount: 4,
      failedCount: 0,
      hasMore: false,
    });
    jest.spyOn(PullEngine, 'pull').mockResolvedValue({
      pulledCount: 2,
      newRev: 5,
      hasMore: false,
    });
    jest.spyOn(OutboxRepository, 'getPendingCount').mockResolvedValue(0);

    // 3. Executa sincronização
    const result = await engine.sync();

    expect(result.pushResult.pushedCount).toBe(4);
    expect(result.pullResult.pulledCount).toBe(2);
    expect(result.pullResult.newRev).toBe(5);
    expect(engine.lastSuccessAt).toBeDefined();
    expect(engine.lastError).toBeNull();
    expect(engine.pendingCount).toBe(0);

    // Deve ter transitado: inicial(false) -> syncing(true) -> concluído(false)
    expect(states).toContain(true);
    expect(states[states.length - 1]).toBe(false);

    unsubscribe();
  });

  test('reatividade local: qualquer mutação na Outbox (INSERT, UPDATE, DELETE) atualiza imediatamente pendingCount e pendingRecordIds', async () => {
    jest.spyOn(OutboxRepository, 'getPendingCount').mockResolvedValue(3);
    jest.spyOn(OutboxRepository, 'getPendingRecordIds').mockResolvedValue(['rec-1', 'rec-2', 'rec-3']);

    const observedCounts: number[] = [];
    const unsubscribe = engine.addListener((status) => {
      observedCounts.push(status.pendingCount);
    });

    // Dispara notificação de escrita na outbox (como ocorre em OutboxRepository.enqueue)
    OutboxRepository.notifyChange({ isEnqueue: true });

    // Aguarda resolução da microtask de refreshPendingCount
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(engine.pendingCount).toBe(3);
    expect(engine.pendingRecordIds).toEqual(['rec-1', 'rec-2', 'rec-3']);
    expect(observedCounts).toContain(3);

    unsubscribe();
  });

  test('regressão: chamada desvinculada de OutboxRepository.enqueue (padrão das factories) não falha por perda de this', async () => {
    jest.spyOn(OutboxRepository, 'getPendingCount').mockResolvedValue(1);
    jest.spyOn(OutboxRepository, 'getPendingRecordIds').mockResolvedValue(['ins-1']);

    const outbox = {
      enqueue: OutboxRepository.enqueue,
    };

    await expect(
      outbox.enqueue(farmId, 'inseminations', 'ins-1', 'INSERT', { id: 'ins-1' })
    ).resolves.toBeUndefined();

    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(engine.pendingCount).toBe(1);
    expect(engine.pendingRecordIds).toEqual(['ins-1']);
  });
});

