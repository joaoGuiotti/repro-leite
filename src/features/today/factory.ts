import { DrizzleTransactionRunner } from '@core/db/transaction';
import { ConfirmHeatObservationUseCase } from './application/confirm-heat-choice.usecase';
import { GetTodayDashboardUseCase } from './application/get-today-dashboard.usecase';
import { RecordPregnancyDiagnosisUseCase } from './application/record-pregnancy-touch.usecase';
import { TodayOutboxServiceImpl } from './infra/today-outbox';
import { TodayRepositoryImpl } from './infra/today.repository.impl';

export interface TodayUseCases {
  getDashboardUseCase: GetTodayDashboardUseCase;
  confirmHeatUseCase: ConfirmHeatObservationUseCase;
  recordPregnancyUseCase: RecordPregnancyDiagnosisUseCase;
}

let cachedUseCases: TodayUseCases | null = null;

/**
 * Composition Root para a feature Today.
 * Instancia repositórios e serviços de infraestrutura e injeta nos casos de uso.
 */
export function getTodayUseCases(): TodayUseCases {
  if (!cachedUseCases) {
    const todayRepo = new TodayRepositoryImpl();
    const outbox = new TodayOutboxServiceImpl();
    const tx = new DrizzleTransactionRunner();

    cachedUseCases = {
      getDashboardUseCase: new GetTodayDashboardUseCase(todayRepo),
      confirmHeatUseCase: new ConfirmHeatObservationUseCase(
        todayRepo,
        outbox,
        tx
      ),
      recordPregnancyUseCase: new RecordPregnancyDiagnosisUseCase(
        todayRepo,
        outbox,
        tx
      ),
    };
  }

  return cachedUseCases;
}
