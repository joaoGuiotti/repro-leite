import { PushEngine } from '../push';
import { OutboxRepository } from '../outbox.repository';
import { FakeRemoteSyncGateway } from '../../network/api-client';
import * as schema from '@core/db/schema';

describe('Sync: PushEngine', () => {
  let gateway: FakeRemoteSyncGateway;
  const farmId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    gateway = new FakeRemoteSyncGateway();
    jest.restoreAllMocks();
  });

  test('quando outbox está vazia, retorna 0 itens e hasMore false', async () => {
    jest.spyOn(OutboxRepository, 'peekBatch').mockResolvedValue([]);

    const result = await PushEngine.push(farmId, gateway);
    expect(result.pushedCount).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  test('deve marcar itens in_flight, enviar ao gateway e marcar concluídos no sucesso', async () => {
    const fakeBatch: schema.SyncQueueEntry[] = [
      {
        id: 'outbox-1',
        operationId: 'op-1',
        farmId,
        tableName: 'animals',
        recordId: 'anim-101',
        operation: 'INSERT',
        payloadJson: JSON.stringify({ ear_tag: '101', name: 'Mimosa' }),
        status: 'pending',
        attempts: 0,
        nextRetryAt: null,
        lastError: null,
        createdAt: '2026-10-14T10:00:00.000Z',
        updatedAt: '2026-10-14T10:00:00.000Z',
      },
    ];

    const peekSpy = jest.spyOn(OutboxRepository, 'peekBatch').mockResolvedValue(fakeBatch);
    const inFlightSpy = jest.spyOn(OutboxRepository, 'markInFlight').mockResolvedValue();
    const completedSpy = jest.spyOn(OutboxRepository, 'markCompleted').mockResolvedValue();
    jest.spyOn(PushEngine as any, 'updateLastPushedAt').mockResolvedValue(undefined);

    const result = await PushEngine.push(farmId, gateway, 50);

    expect(peekSpy).toHaveBeenCalledWith(farmId, 50, expect.any(Date));
    expect(inFlightSpy).toHaveBeenCalledWith(['outbox-1']);
    expect(completedSpy).toHaveBeenCalledWith(['outbox-1']);
    expect(result.pushedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(gateway.isOperationProcessed('op-1')).toBe(true);
  });

  test('idempotência: reenvio de operação já processada confirma sucesso sem duplicar', async () => {
    const fakeBatch: schema.SyncQueueEntry[] = [
      {
        id: 'outbox-2',
        operationId: 'op-2',
        farmId,
        tableName: 'bulls',
        recordId: 'bull-50',
        operation: 'INSERT',
        payloadJson: JSON.stringify({ name: 'Touro Radar' }),
        status: 'pending',
        attempts: 0,
        nextRetryAt: null,
        lastError: null,
        createdAt: '2026-10-14T10:00:00.000Z',
        updatedAt: '2026-10-14T10:00:00.000Z',
      },
    ];

    jest.spyOn(OutboxRepository, 'peekBatch').mockResolvedValue(fakeBatch);
    jest.spyOn(OutboxRepository, 'markInFlight').mockResolvedValue();
    const completedSpy = jest.spyOn(OutboxRepository, 'markCompleted').mockResolvedValue();
    jest.spyOn(PushEngine as any, 'updateLastPushedAt').mockResolvedValue(undefined);

    // Primeiro envio
    await PushEngine.push(farmId, gateway, 50);
    expect(gateway.isOperationProcessed('op-2')).toBe(true);

    // Segundo envio (simulando retransmissão após timeout)
    const result2 = await PushEngine.push(farmId, gateway, 50);
    expect(result2.pushedCount).toBe(1);
    expect(completedSpy).toHaveBeenCalledTimes(2);
  });

  test('falha parcial: item com erro é marcado com falha e backoff, item bem-sucedido é completado', async () => {
    const fakeBatch: schema.SyncQueueEntry[] = [
      {
        id: 'outbox-ok',
        operationId: 'op-ok',
        farmId,
        tableName: 'animals',
        recordId: 'anim-1',
        operation: 'INSERT',
        payloadJson: JSON.stringify({ ear_tag: '1' }),
        status: 'pending',
        attempts: 0,
        nextRetryAt: null,
        lastError: null,
        createdAt: '2026-10-14T10:00:00.000Z',
        updatedAt: '2026-10-14T10:00:00.000Z',
      },
      {
        id: 'outbox-err',
        operationId: 'op-err',
        farmId,
        tableName: 'animals',
        recordId: 'anim-2',
        operation: 'INSERT',
        payloadJson: JSON.stringify({ ear_tag: '2' }),
        status: 'pending',
        attempts: 1,
        nextRetryAt: null,
        lastError: null,
        createdAt: '2026-10-14T10:00:00.000Z',
        updatedAt: '2026-10-14T10:00:00.000Z',
      },
    ];

    jest.spyOn(OutboxRepository, 'peekBatch').mockResolvedValue(fakeBatch);
    jest.spyOn(OutboxRepository, 'markInFlight').mockResolvedValue();
    const completedSpy = jest.spyOn(OutboxRepository, 'markCompleted').mockResolvedValue();
    const failureSpy = jest.spyOn(OutboxRepository, 'recordFailure').mockResolvedValue();
    jest.spyOn(PushEngine as any, 'updateLastPushedAt').mockResolvedValue(undefined);

    jest.spyOn(gateway, 'pushBatch').mockResolvedValue({
      success: false,
      processedOperationIds: ['op-ok'],
      failedOperations: [{ operationId: 'op-err', error: 'Database constraint error' }],
    });

    const result = await PushEngine.push(farmId, gateway);

    expect(completedSpy).toHaveBeenCalledWith(['outbox-ok']);
    expect(failureSpy).toHaveBeenCalledWith(
      'outbox-err',
      'Database constraint error',
      expect.any(Number)
    );
    expect(result.pushedCount).toBe(1);
    expect(result.failedCount).toBe(1);
  });

  test('falha total de rede: registra falha em todos os itens e propaga erro', async () => {
    const fakeBatch: schema.SyncQueueEntry[] = [
      {
        id: 'outbox-fail',
        operationId: 'op-fail',
        farmId,
        tableName: 'settings',
        recordId: 'setting-1',
        operation: 'UPDATE',
        payloadJson: JSON.stringify({ key: 'dias_toque', value: '45' }),
        status: 'pending',
        attempts: 0,
        nextRetryAt: null,
        lastError: null,
        createdAt: '2026-10-14T10:00:00.000Z',
        updatedAt: '2026-10-14T10:00:00.000Z',
      },
    ];

    jest.spyOn(OutboxRepository, 'peekBatch').mockResolvedValue(fakeBatch);
    jest.spyOn(OutboxRepository, 'markInFlight').mockResolvedValue();
    const failureSpy = jest.spyOn(OutboxRepository, 'recordFailure').mockResolvedValue();

    gateway.setShouldFailPush(true, 'Connection reset by peer');

    await expect(PushEngine.push(farmId, gateway)).rejects.toThrow('Connection reset by peer');

    expect(failureSpy).toHaveBeenCalledWith(
      'outbox-fail',
      'Connection reset by peer',
      expect.any(Number)
    );
  });
});
