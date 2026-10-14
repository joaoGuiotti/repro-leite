import { AppError, appError, err, ok, Result } from '@core/result';
import { TransactionRunner } from '@core/db/transaction';
import { AlertRepository } from '../domain/alert.repository';
import { OutboxEnqueuer } from './create-alert.usecase';

export class DismissAlertsBySourceUseCase {
  constructor(
    private repo: AlertRepository,
    private outbox: OutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(farmId: string, sourceId: string): Promise<Result<void, AppError>> {
    if (!sourceId) {
      return err(appError('VALIDATION_ERROR', 'ID de origem é obrigatório.'));
    }

    const now = new Date().toISOString();

    try {
      await this.tx.run(async () => {
        await this.repo.softDeleteBySourceId(sourceId);
        await this.outbox.enqueue(
          farmId,
          'alerts',
          sourceId,
          'UPDATE',
          { deletedAt: now, updatedAt: now }
        );
      });

      return ok(undefined);
    } catch (e: any) {
      return err(
        appError(
          'UPDATE_FAILED',
          e.message || 'Falha ao cancelar alertas vinculados à origem.'
        )
      );
    }
  }
}
