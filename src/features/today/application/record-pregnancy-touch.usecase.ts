import { AppError, appError, err, ok, Result } from '@core/result';
import { TransactionRunner } from '@core/db/transaction';
import { TodayOutboxEnqueuer, TodayRepository } from '../domain/today.repository';
import { PregnancyDiagnosis } from '../domain/today.types';

export interface RecordPregnancyDiagnosisInput {
  farmId: string;
  alertId: string;
  animalId: string;
  inseminationId?: string | null;
  diagnosis: PregnancyDiagnosis;
  referenceDate: string;
  notes?: string | null;
}

export interface RecordPregnancyDiagnosisResult {
  success: boolean;
  newStatus: 'prenhe' | 'vazia';
}

export class RecordPregnancyDiagnosisUseCase {
  constructor(
    private repo: TodayRepository,
    private outbox: TodayOutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(
    input: RecordPregnancyDiagnosisInput
  ): Promise<Result<RecordPregnancyDiagnosisResult, AppError>> {
    if (!input.alertId) {
      return err(appError('INVALID_ALERT', 'Identificador do alerta de toque é obrigatório.'));
    }
    if (!input.animalId) {
      return err(appError('INVALID_ANIMAL', 'Identificador da vaca é obrigatório.'));
    }

    const now = new Date().toISOString();
    const isPregnant = input.diagnosis === 'pregnant';
    const targetStatus = isPregnant ? 'prenhe' : 'vazia';

    return this.tx.run(async () => {
      // 1. Atualiza status reprodutivo do animal
      await this.repo.updateAnimalReproStatus(input.animalId, targetStatus);
      await this.outbox.enqueue(
        input.farmId,
        'animals',
        input.animalId,
        'UPDATE',
        { reproStatus: targetStatus, updatedAt: now }
      );

      // 2. Atualiza resultado da inseminação
      if (input.inseminationId) {
        await this.repo.updateInseminationResult(input.inseminationId, targetStatus);
        await this.outbox.enqueue(
          input.farmId,
          'inseminations',
          input.inseminationId,
          'UPDATE',
          { result: targetStatus, updatedAt: now }
        );
      }

      // 3. Conclui o alerta de toque veterinário
      await this.repo.completeAlert(input.alertId);
      await this.outbox.enqueue(
        input.farmId,
        'alerts',
        input.alertId,
        'UPDATE',
        { completedAt: now, updatedAt: now }
      );

      // 4. Se vazia, cancela os alertas futuros de parto e secagem daquela IA
      if (!isPregnant && input.inseminationId) {
        await this.repo.cancelAlertsBySourceId(input.inseminationId);
        await this.outbox.enqueue(
          input.farmId,
          'alerts',
          input.inseminationId,
          'DELETE',
          { cascadeCancelledBySourceId: input.inseminationId, deletedAt: now }
        );
      }

      return ok({
        success: true,
        newStatus: targetStatus,
      });
    });
  }
}
