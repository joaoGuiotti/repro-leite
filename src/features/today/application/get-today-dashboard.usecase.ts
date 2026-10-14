import { AppError, appError, err, ok, Result } from '@core/result';
import { calculateDailyFeedingSummary } from '../domain/feeding-summary';
import {
  isHeatCheckInZootecnicWindow,
  isPregnancyCheckInZootecnicWindow,
} from '../domain/today-filters';
import { TodayRepository } from '../domain/today.repository';
import { TodayDashboardData } from '../domain/today.types';

export interface GetTodayDashboardInput {
  farmId: string;
  referenceDate: string;
}

export class GetTodayDashboardUseCase {
  constructor(private repo: TodayRepository) {}

  async execute(
    input: GetTodayDashboardInput
  ): Promise<Result<TodayDashboardData, AppError>> {
    if (!input.farmId) {
      return err(appError('INVALID_FARM', 'Identificador da fazenda é obrigatório.'));
    }
    if (!input.referenceDate) {
      return err(appError('INVALID_DATE', 'Data de referência é obrigatória.'));
    }

    try {
      const [allAlerts, allAnimals] = await Promise.all([
        this.repo.getPendingAlertsEnriched(input.farmId, input.referenceDate),
        this.repo.listAnimalsForFeeding(input.farmId),
      ]);

      // 1. Filtra Cios para Vigiar na janela zootécnica
      const heatAlerts = allAlerts.filter(
        (a) =>
          a.type === 'heat_check_21d' &&
          isHeatCheckInZootecnicWindow(a.dueDate, input.referenceDate)
      );

      // 2. Filtra Toques Veterinários na janela zootécnica
      const pregnancyAlerts = allAlerts.filter(
        (a) =>
          a.type === 'pregnancy_check_45d' &&
          isPregnancyCheckInZootecnicWindow(a.dueDate, input.referenceDate)
      );

      // 3. Calcula consumo e transições das bezerras
      const feedingSummary = calculateDailyFeedingSummary(
        allAnimals,
        input.referenceDate
      );

      return ok({
        referenceDate: input.referenceDate,
        isSimulated: false, // preenchido na apresentação com base no hook de simulação
        heatAlerts,
        pregnancyAlerts,
        feedingSummary,
        counts: {
          pendingHeat: heatAlerts.length,
          pendingPregnancy: pregnancyAlerts.length,
          totalMorningLiters: feedingSummary.totalMorningLiters,
          totalAfternoonLiters: feedingSummary.totalAfternoonLiters,
          activeCalves: feedingSummary.activeCalvesCount,
        },
      });
    } catch (error) {
      return err(
        appError(
          'DASHBOARD_LOAD_FAILED',
          'Falha ao carregar o painel do dia.',
          error
        )
      );
    }
  }
}
