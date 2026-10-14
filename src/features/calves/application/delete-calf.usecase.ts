import { AppError, appError, err, ok, Result } from '@core/result';
import { TransactionRunner } from '@core/db/transaction';
import { CalvesOutboxEnqueuer, CalvesRepository } from '../domain/calves.repository';

export interface DeleteCalfInput {
  farmId: string;
  calfId: string;
  reason?: string;
}

export interface DeleteCalfResult {
  id: string;
}

export class DeleteCalfUseCase {
  constructor(
    private repo: CalvesRepository,
    private outbox: CalvesOutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(
    input: DeleteCalfInput
  ): Promise<Result<DeleteCalfResult, AppError>> {
    if (!input.farmId) {
      return err(appError('INVALID_FARM', 'Identificador da fazenda é obrigatório.'));
    }
    if (!input.calfId) {
      return err(appError('INVALID_CALF', 'Identificador do animal é obrigatório.'));
    }

    const calf = await this.repo.findCalfById(input.calfId);
    if (!calf) {
      return err(appError('CALF_NOT_FOUND', 'Animal não encontrado.'));
    }

    try {
      await this.tx.run(async () => {
        await this.repo.softDeleteCalf(input.calfId);
        await this.outbox.enqueue(
          input.farmId,
          'animals',
          input.calfId,
          'DELETE',
          { reason: input.reason ?? 'Exclusão de bezerra' }
        );
      });

      return ok({ id: input.calfId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao excluir animal.';
      return err(appError('DB_ERROR', msg));
    }
  }
}
