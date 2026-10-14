import { TodayRepository } from '../../domain/today.repository';
import { GetTodayDashboardUseCase } from '../get-today-dashboard.usecase';

describe('GetTodayDashboardUseCase', () => {
  let repo: jest.Mocked<TodayRepository>;
  let useCase: GetTodayDashboardUseCase;

  beforeEach(() => {
    repo = {
      getPendingAlertsEnriched: jest.fn().mockResolvedValue([]),
      listAnimalsForFeeding: jest.fn().mockResolvedValue([]),
      completeAlert: jest.fn().mockResolvedValue(undefined),
      cancelAlertsBySourceId: jest.fn().mockResolvedValue(undefined),
      updateAnimalReproStatus: jest.fn().mockResolvedValue(undefined),
      updateInseminationResult: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new GetTodayDashboardUseCase(repo);
  });

  it('consolida cios, toques e aleitamento para a data de referência', async () => {
    repo.getPendingAlertsEnriched.mockResolvedValue([
      {
        id: 'a1',
        farmId: 'f1',
        targetAnimalId: 'cow1',
        type: 'heat_check_21d',
        dueDate: '2026-10-14',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
        animalEarTag: '10',
        isOverdue: false,
      },
      {
        id: 'a2',
        farmId: 'f1',
        targetAnimalId: 'cow2',
        type: 'pregnancy_check_45d',
        dueDate: '2026-10-14',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
        animalEarTag: '20',
        isOverdue: false,
      },
      {
        id: 'a3',
        farmId: 'f1',
        targetAnimalId: 'cow3',
        type: 'heat_check_21d',
        dueDate: '2026-10-25', // fora da janela (+11d)
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
        animalEarTag: '30',
        isOverdue: false,
      },
    ]);

    repo.listAnimalsForFeeding.mockResolvedValue([
      {
        id: 'c1',
        earTag: 'B1',
        sex: 'femea',
        birthDate: '2026-09-14', // 30 dias -> pico (4L + 4L)
        exitStatus: 'ativo',
      },
    ]);

    const result = await useCase.execute({
      farmId: 'f1',
      referenceDate: '2026-10-14',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.heatAlerts).toHaveLength(1);
      expect(result.value.pregnancyAlerts).toHaveLength(1);
      expect(result.value.counts.pendingHeat).toBe(1);
      expect(result.value.counts.pendingPregnancy).toBe(1);
      expect(result.value.counts.totalMorningLiters).toBe(4);
      expect(result.value.counts.totalAfternoonLiters).toBe(4);
    }
  });
});
