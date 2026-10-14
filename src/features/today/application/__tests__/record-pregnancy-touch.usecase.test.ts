import { TodayOutboxEnqueuer, TodayRepository } from '../../domain/today.repository';
import { RecordPregnancyDiagnosisUseCase } from '../record-pregnancy-touch.usecase';

describe('RecordPregnancyDiagnosisUseCase', () => {
  let repo: jest.Mocked<TodayRepository>;
  let outbox: jest.Mocked<TodayOutboxEnqueuer>;
  let txRunner: { run: jest.Mock };
  let useCase: RecordPregnancyDiagnosisUseCase;

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

    useCase = new RecordPregnancyDiagnosisUseCase(
      repo,
      outbox,
      txRunner
    );
  });

  it('processa "pregnant" (Confirmar Prenhez): atualiza animal para prenhe, IA para prenhe, conclui toque e preserva parto/secagem', async () => {
    const result = await useCase.execute({
      farmId: 'farm-1',
      alertId: 'alert-toque-1',
      animalId: 'animal-1',
      inseminationId: 'insem-1',
      diagnosis: 'pregnant',
      referenceDate: '2026-10-14',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.success).toBe(true);
      expect(result.value.newStatus).toBe('prenhe');
    }

    expect(repo.updateAnimalReproStatus).toHaveBeenCalledWith('animal-1', 'prenhe');
    expect(repo.updateInseminationResult).toHaveBeenCalledWith('insem-1', 'prenhe');
    expect(repo.completeAlert).toHaveBeenCalledWith('alert-toque-1');
    expect(repo.cancelAlertsBySourceId).not.toHaveBeenCalled();
    expect(outbox.enqueue).toHaveBeenCalledTimes(3);
  });

  it('processa "empty" (Vazia): atualiza animal para vazia, IA para vazia, conclui toque e cancela alertas futuros de parto/secagem', async () => {
    const result = await useCase.execute({
      farmId: 'farm-1',
      alertId: 'alert-toque-2',
      animalId: 'animal-2',
      inseminationId: 'insem-2',
      diagnosis: 'empty',
      referenceDate: '2026-10-14',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.success).toBe(true);
      expect(result.value.newStatus).toBe('vazia');
    }

    expect(repo.updateAnimalReproStatus).toHaveBeenCalledWith('animal-2', 'vazia');
    expect(repo.updateInseminationResult).toHaveBeenCalledWith('insem-2', 'vazia');
    expect(repo.completeAlert).toHaveBeenCalledWith('alert-toque-2');
    expect(repo.cancelAlertsBySourceId).toHaveBeenCalledWith('insem-2');
    expect(outbox.enqueue).toHaveBeenCalledTimes(4); // animal, insem, alert-complete, alert-cancel
  });

  it('retorna erro se alertId ou animalId forem inválidos', async () => {
    const result = await useCase.execute({
      farmId: 'farm-1',
      alertId: '',
      animalId: 'animal-1',
      diagnosis: 'pregnant',
      referenceDate: '2026-10-14',
    });

    expect(result.ok).toBe(false);
  });
});
