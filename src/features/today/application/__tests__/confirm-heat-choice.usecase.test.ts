import { TodayOutboxEnqueuer, TodayRepository } from '../../domain/today.repository';
import { ConfirmHeatObservationUseCase } from '../confirm-heat-choice.usecase';

describe('ConfirmHeatObservationUseCase', () => {
  let repo: jest.Mocked<TodayRepository>;
  let outbox: jest.Mocked<TodayOutboxEnqueuer>;
  let txRunner: { run: jest.Mock };
  let useCase: ConfirmHeatObservationUseCase;

  beforeEach(() => {
    repo = {
      getPendingAlertsEnriched: jest.fn(),
      listAnimalsForFeeding: jest.fn(),
      completeAlert: jest.fn().mockResolvedValue(undefined),
      cancelAlertsBySourceId: jest.fn().mockResolvedValue(undefined),
      updateAnimalReproStatus: jest.fn().mockResolvedValue(undefined),
      updateInseminationResult: jest.fn().mockResolvedValue(undefined),
    };
    outbox = {
      enqueue: jest.fn().mockResolvedValue(undefined),
    };
    txRunner = {
      run: jest.fn().mockImplementation(async (cb) => cb()),
    };

    useCase = new ConfirmHeatObservationUseCase(
      repo,
      outbox,
      txRunner
    );
  });

  it('processa "held" (Não Repetiu): conclui alerta 21d mantendo status inseminada', async () => {
    const result = await useCase.execute({
      farmId: 'farm-1',
      alertId: 'alert-1',
      animalId: 'animal-1',
      inseminationId: 'insem-1',
      choice: 'held',
      referenceDate: '2026-10-14',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.success).toBe(true);
      expect(result.value.redirectToRebreed).toBe(false);
    }

    expect(repo.completeAlert).toHaveBeenCalledWith('alert-1');
    expect(repo.updateAnimalReproStatus).not.toHaveBeenCalled();
    expect(repo.updateInseminationResult).not.toHaveBeenCalled();
    expect(outbox.enqueue).toHaveBeenCalledWith(
      'farm-1',
      'alerts',
      'alert-1',
      'UPDATE',
      expect.objectContaining({ completedAt: expect.any(String) })
    );
  });

  it('processa "repeated_empty_only" (Repetiu - Apenas Vazia): atualiza IA para vazia, animal para vazia e conclui alerta', async () => {
    const result = await useCase.execute({
      farmId: 'farm-1',
      alertId: 'alert-1',
      animalId: 'animal-1',
      inseminationId: 'insem-1',
      choice: 'repeated_empty_only',
      referenceDate: '2026-10-14',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.success).toBe(true);
      expect(result.value.redirectToRebreed).toBe(false);
    }

    expect(repo.completeAlert).toHaveBeenCalledWith('alert-1');
    expect(repo.updateInseminationResult).toHaveBeenCalledWith('insem-1', 'vazia');
    expect(repo.updateAnimalReproStatus).toHaveBeenCalledWith('animal-1', 'vazia');
    expect(outbox.enqueue).toHaveBeenCalledTimes(3); // alert, insem, animal
  });

  it('processa "repeated_rebreed" (Repetiu - Re-inseminar agora): atualiza IA para vazia, conclui alerta e sinaliza redirecionamento', async () => {
    const result = await useCase.execute({
      farmId: 'farm-1',
      alertId: 'alert-1',
      animalId: 'animal-1',
      inseminationId: 'insem-1',
      choice: 'repeated_rebreed',
      referenceDate: '2026-10-14',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.success).toBe(true);
      expect(result.value.redirectToRebreed).toBe(true);
      expect(result.value.animalId).toBe('animal-1');
    }

    expect(repo.completeAlert).toHaveBeenCalledWith('alert-1');
    expect(repo.updateInseminationResult).toHaveBeenCalledWith('insem-1', 'vazia');
  });

  it('retorna erro se alertId for vazio', async () => {
    const result = await useCase.execute({
      farmId: 'farm-1',
      alertId: '',
      animalId: 'animal-1',
      choice: 'held',
      referenceDate: '2026-10-14',
    });

    expect(result.ok).toBe(false);
  });
});
