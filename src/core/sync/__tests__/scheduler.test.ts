import { SyncScheduler } from '../scheduler';
import { SyncEngine } from '../sync-engine';
import { NetworkMonitor } from '../../network/network-monitor';
import { FakeRemoteSyncGateway } from '../../network/api-client';

describe('Sync: SyncScheduler', () => {
  let engine: SyncEngine;
  let monitor: NetworkMonitor;
  let scheduler: SyncScheduler;

  beforeEach(() => {
    jest.useFakeTimers();
    engine = new SyncEngine(new FakeRemoteSyncGateway(), monitor);
    monitor = new NetworkMonitor();
    scheduler = new SyncScheduler({
      engine,
      monitor,
      postWriteDebounceMs: 200,
      periodicIntervalMs: 5000,
    });
  });

  afterEach(() => {
    scheduler.stop();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('triggerPostWriteSync deve agrupar chamadas rápidas através de debounce', () => {
    const syncSpy = jest.spyOn(engine, 'sync').mockResolvedValue({
      pushResult: { pushedCount: 0, failedCount: 0, hasMore: false },
      pullResult: { pulledCount: 0, newRev: 0, hasMore: false },
    });

    scheduler.start();

    // 3 escritas consecutivas no curral
    scheduler.triggerPostWriteSync();
    scheduler.triggerPostWriteSync();
    scheduler.triggerPostWriteSync();

    // Imediatamente não deve ter disparado ainda
    expect(syncSpy).not.toHaveBeenCalled();

    // Avança o tempo além do debounce (200ms)
    jest.advanceTimersByTime(250);

    // Deve ter disparado exatamente UMA vez
    expect(syncSpy).toHaveBeenCalledTimes(1);
  });

  test('reconectar à rede deve disparar sincronização se estiver em foreground', () => {
    const syncSpy = jest.spyOn(engine, 'sync').mockResolvedValue({
      pushResult: { pushedCount: 0, failedCount: 0, hasMore: false },
      pullResult: { pulledCount: 0, newRev: 0, hasMore: false },
    });

    scheduler.start();

    // Simula desconexão e reconexão
    monitor.simulateOffline(true);
    expect(syncSpy).not.toHaveBeenCalled();

    monitor.simulateOffline(false);
    expect(syncSpy).toHaveBeenCalledTimes(1);
  });

  test('stop deve interromper timers e desregistrar observadores', () => {
    const syncSpy = jest.spyOn(engine, 'sync').mockResolvedValue({
      pushResult: { pushedCount: 0, failedCount: 0, hasMore: false },
      pullResult: { pulledCount: 0, newRev: 0, hasMore: false },
    });

    scheduler.start();
    expect(scheduler.isRunning).toBe(true);

    scheduler.stop();
    expect(scheduler.isRunning).toBe(false);

    // Tentativa de post-write após stop não deve disparar
    scheduler.triggerPostWriteSync();
    jest.advanceTimersByTime(500);

    expect(syncSpy).not.toHaveBeenCalled();
  });
});
