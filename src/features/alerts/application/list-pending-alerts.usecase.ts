import { AppError, appError, err, ok, Result } from '@core/result';
import { AlertWithAnimalSummary } from '../domain/alert.entity';
import { AlertRepository } from '../domain/alert.repository';

export class ListPendingAlertsUseCase {
  constructor(private repo: AlertRepository) {}

  async execute(
    farmId: string,
    upToDate?: string
  ): Promise<Result<AlertWithAnimalSummary[], AppError>> {
    if (!farmId) {
      return err(appError('VALIDATION_ERROR', 'ID da fazenda é obrigatório.'));
    }

    try {
      const alerts = await this.repo.listPendingByFarm(farmId, upToDate);
      return ok(alerts);
    } catch (e: any) {
      return err(
        appError(
          'INTERNAL_ERROR',
          e.message || 'Falha ao listar alertas pendentes.'
        )
      );
    }
  }
}
