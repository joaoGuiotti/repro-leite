import { AppError, appError, err, ok, Result } from '@core/result';
import { TransactionRunner } from '@core/db/transaction';
import { TodayOutboxEnqueuer, TodayRepository } from '../domain/today.repository';
import { HeatObservationChoice } from '../domain/today.types';

export interface ConfirmHeatObservationInput {
  farmId: string;
  alertId: string;
  animalId: string;
  inseminationId?: string | null;
  choice: HeatObservationChoice;
  referenceDate: string;
}

export interface ConfirmHeatObservationResult {
  success: boolean;
  redirectToRebreed: boolean;
  animalId?: string;
}

export class ConfirmHeatObservationUseCase {
  constructor(
    private repo: TodayRepository,
    private outbox: TodayOutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(
    input: ConfirmHeatObservationInput
  ): Promise<Result<ConfirmHeatObservationResult, AppError>> {
    if (!input.alertId) {
      return err(appError('INVALID_ALERT', 'Identificador do alerta é obrigatório.'));
    }
    if (!input.animalId) {
      return err(appError('INVALID_ANIMAL', 'Identificador da fêmea é obrigatório.'));
    }

    const now = new Date().toISOString();

    return this.tx.run(async () => {
      // 1. "Não Repetiu": segurou o cio provisoriamente
      if (input.choice === 'held') {
        await this.repo.completeAlert(input.alertId);
        await this.outbox.enqueue(
          input.farmId,
          'alerts',
          input.alertId,
          'UPDATE',
          { completedAt: now, updatedAt: now }
        );

        return ok({
          success: true,
          redirectToRebreed: false,
        });
      }

      // 2. "Repetiu o Cio": encerra a IA anterior como vazia
      if (input.inseminationId) {
        await this.repo.updateInseminationResult(input.inseminationId, 'vazia');
        await this.outbox.enqueue(
          input.farmId,
          'inseminations',
          input.inseminationId,
          'UPDATE',
          { result: 'vazia', updatedAt: now }
        );
      }

      // Conclui o alerta de retorno de cio de 21d
      await this.repo.completeAlert(input.alertId);
      await this.outbox.enqueue(
        input.farmId,
        'alerts',
        input.alertId,
        'UPDATE',
        { completedAt: now, updatedAt: now }
      );

      // Sub-escolha A: apenas registrar vazia
      if (input.choice === 'repeated_empty_only') {
        await this.repo.updateAnimalReproStatus(input.animalId, 'vazia');
        await this.outbox.enqueue(
          input.farmId,
          'animals',
          input.animalId,
          'UPDATE',
          { reproStatus: 'vazia', updatedAt: now }
        );

        return ok({
          success: true,
          redirectToRebreed: false,
        });
      }

      // Sub-escolha B: re-inseminar agora
      return ok({
        success: true,
        redirectToRebreed: true,
        animalId: input.animalId,
      });
    });
  }
}
