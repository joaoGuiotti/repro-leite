import { OutboxRepository } from '@core/sync/outbox.repository';
import { ConfirmHeatObservationUseCase } from '../../application/confirm-heat-choice.usecase';
import { RecordPregnancyDiagnosisUseCase } from '../../application/record-pregnancy-touch.usecase';
import { TodayRepository } from '../../domain/today.repository';
import { TodayOutboxServiceImpl } from '../today-outbox';

jest.mock('@core/sync/outbox.repository', () => ({
  OutboxRepository: {
    enqueue: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('Today Outbox & Atomic Transaction Tests (US5)', () => {
  let executedInTx = false;
  const mockTxRunner = {
    run: jest.fn().mockImplementation(async (cb) => {
      executedInTx = true;
      return cb();
    }),
  };

  const mockOutbox = {
    enqueue: jest.fn().mockResolvedValue(undefined),
  };

  const mockRepo: jest.Mocked<TodayRepository> = {
    getPendingAlertsEnriched: jest.fn(),
    listAnimalsForFeeding: jest.fn(),
    completeAlert: jest.fn().mockResolvedValue(undefined),
    cancelAlertsBySourceId: jest.fn().mockResolvedValue(undefined),
    updateAnimalReproStatus: jest.fn().mockResolvedValue(undefined),
    updateInseminationResult: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    executedInTx = false;
    jest.clearAllMocks();
  });

  it('TodayOutboxServiceImpl encaminha chamadas para OutboxRepository central', async () => {
    const service = new TodayOutboxServiceImpl();
    await service.enqueue('farm-1', 'alerts', 'alt-1', 'UPDATE', { status: 'concluido' });

    expect(OutboxRepository.enqueue).toHaveBeenCalledWith(
      'farm-1',
      'alerts',
      'alt-1',
      'UPDATE',
      { status: 'concluido' }
    );
  });

  it('garante que a decisão de cio roda dentro de transação atômica e enfileira na outbox', async () => {
    const useCase = new ConfirmHeatObservationUseCase(
      mockRepo,
      mockOutbox,
      mockTxRunner
    );

    const res = await useCase.execute({
      farmId: 'farm-test',
      alertId: 'alert-1',
      animalId: 'cow-1',
      inseminationId: 'insem-1',
      choice: 'repeated_empty_only',
      referenceDate: '2026-10-14',
    });

    expect(res.ok).toBe(true);
    expect(executedInTx).toBe(true);
    expect(mockOutbox.enqueue).toHaveBeenCalledWith(
      'farm-test',
      'inseminations',
      'insem-1',
      'UPDATE',
      expect.any(Object)
    );
    expect(mockOutbox.enqueue).toHaveBeenCalledWith(
      'farm-test',
      'alerts',
      'alert-1',
      'UPDATE',
      expect.any(Object)
    );
    expect(mockOutbox.enqueue).toHaveBeenCalledWith(
      'farm-test',
      'animals',
      'cow-1',
      'UPDATE',
      expect.any(Object)
    );
  });

  it('garante que a confirmação de toque roda dentro de transação atômica e enfileira na outbox', async () => {
    const useCase = new RecordPregnancyDiagnosisUseCase(
      mockRepo,
      mockOutbox,
      mockTxRunner
    );

    const res = await useCase.execute({
      farmId: 'farm-test',
      alertId: 'alert-toque',
      animalId: 'cow-2',
      inseminationId: 'insem-2',
      diagnosis: 'pregnant',
      referenceDate: '2026-10-14',
    });

    expect(res.ok).toBe(true);
    expect(executedInTx).toBe(true);
    expect(mockOutbox.enqueue).toHaveBeenCalledWith(
      'farm-test',
      'animals',
      'cow-2',
      'UPDATE',
      expect.any(Object)
    );
    expect(mockOutbox.enqueue).toHaveBeenCalledWith(
      'farm-test',
      'inseminations',
      'insem-2',
      'UPDATE',
      expect.any(Object)
    );
    expect(mockOutbox.enqueue).toHaveBeenCalledWith(
      'farm-test',
      'alerts',
      'alert-toque',
      'UPDATE',
      expect.any(Object)
    );
  });
});
