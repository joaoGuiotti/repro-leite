import { AppError, appError, err, ok, Result } from '@core/result';
import { TransactionRunner } from '@core/db/transaction';
import { AlertRepository } from '../domain/alert.repository';
import { OutboxEnqueuer } from './create-alert.usecase';

export class CompleteAlertUseCase {
  constructor(
    private repo: AlertRepository,
    private outbox: OutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(alertId: string): Promise<Result<void, AppError>> {
    if (!alertId) {
      return err(appError('VALIDATION_ERROR', 'ID do alerta é obrigatório.'));
    }

    const existing = await this.repo.findById(alertId);
    if (!existing) {
      return err(appError('NOT_FOUND', 'Alerta não encontrado.'));
    }

    const now = new Date().toISOString();

    try {
      await this.tx.run(async () => {
        await this.repo.complete(alertId);
        await this.outbox.enqueue(
          existing.farmId,
          'alerts',
          alertId,
          'UPDATE',
          { completedAt: now, updatedAt: now }
        );
      });

      return ok(undefined);
    } catch (e: any) {
      return err(
        appError('UPDATE_FAILED', e.message || 'Falha ao concluir alerta.')
      );
    }
  }
}
