import { AppError, appError, err, ok, Result } from '@core/result';
import { TransactionRunner } from '@core/db/transaction';
import { BullRecord, AdjustBullStrawsDTO } from '../domain/bull.entity';
import { BullRepository } from '../domain/bull.repository';
import { adjustBullStock } from '../domain/bull-stock';
import { OutboxEnqueuer } from './register-bull.usecase';

export class AdjustBullStrawsUseCase {
  constructor(
    private repo: BullRepository,
    private outbox: OutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(input: AdjustBullStrawsDTO): Promise<Result<BullRecord, AppError>> {
    const existing = await this.repo.findById(input.bullId);
    if (!existing) {
      return err(appError('BULL_NOT_FOUND', `Touro com ID ${input.bullId} não encontrado.`));
    }

    try {
      // Valida pelo motor de domínio
      adjustBullStock(existing.strawsInStock, input.delta);
    } catch (e: any) {
      return err(appError('INVALID_STOCK_ADJUSTMENT', e.message));
    }

    try {
      let updated: BullRecord | null = null;
      await this.tx.run(async () => {
        updated = await this.repo.adjustStraws(input.bullId, input.delta);
        await this.outbox.enqueue(
          existing.farmId,
          'bulls',
          existing.id,
          'UPDATE',
          updated as unknown as Record<string, unknown>
        );
      });
      return ok(updated!);
    } catch (e: any) {
      return err(
        appError('ADJUST_FAILED', e.message || 'Falha ao atualizar estoque de doses.')
      );
    }
  }

  async softDelete(id: string): Promise<Result<void, AppError>> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      return err(appError('BULL_NOT_FOUND', `Touro com ID ${id} não encontrado.`));
    }

    try {
      await this.tx.run(async () => {
        await this.repo.softDelete(id);
        await this.outbox.enqueue(existing.farmId, 'bulls', id, 'DELETE', null);
      });
      return ok(undefined);
    } catch (e: any) {
      return err(appError('DELETE_FAILED', e.message || 'Falha ao remover touro do catálogo.'));
    }
  }
}
