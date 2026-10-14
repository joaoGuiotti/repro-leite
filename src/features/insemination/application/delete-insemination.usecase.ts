import { AppError, appError, err, ok, Result } from '@core/result';
import { TransactionRunner } from '@core/db/transaction';
import { AnimalRepository } from '@features/herd';
import { BullRepository } from '@features/bulls';
import { InseminationRepository } from '../domain/insemination.repository';
import { resolveAnimalReproStatusAfterCancellation } from '../domain/milestones';
import { OutboxEnqueuer } from './register-insemination.usecase';

export interface AlertDeleter {
  softDeleteBySourceId(sourceId: string): Promise<void>;
}

export class DeleteInseminationUseCase {
  constructor(
    private repo: InseminationRepository,
    private animalRepo: AnimalRepository,
    private bullRepo: BullRepository,
    private alertRepo: AlertDeleter,
    private outbox: OutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(
    inseminationId: string,
    options: { restoreStrawStock: boolean } = { restoreStrawStock: true }
  ): Promise<Result<void, AppError>> {
    const existing = await this.repo.findById(inseminationId);
    if (!existing) {
      return err(appError('INSEMINATION_NOT_FOUND', 'Inseminação não encontrada.'));
    }

    const now = new Date().toISOString();

    try {
      await this.tx.run(async () => {
        // 1. Marca soft delete na inseminação
        await this.repo.softDelete(inseminationId);
        await this.outbox.enqueue(
          existing.farmId,
          'inseminations',
          inseminationId,
          'UPDATE',
          { deletedAt: now, updatedAt: now }
        );

        // 2. Cancela alertas vinculados
        await this.alertRepo.softDeleteBySourceId(inseminationId);

        // 3. Estorna dose de sêmen do touro se solicitado
        if (options.restoreStrawStock && existing.bullId) {
          const updatedBull = await this.bullRepo.adjustStraws(existing.bullId, 1);
          await this.outbox.enqueue(
            existing.farmId,
            'bulls',
            existing.bullId,
            'UPDATE',
            updatedBull as unknown as Record<string, unknown>
          );
        }

        // 4. Recalcula o status da fêmea com base nas inseminações restantes
        const remainingHistory = await this.repo.listByAnimal(existing.animalId);
        const novoStatus = resolveAnimalReproStatusAfterCancellation(remainingHistory);

        const updatedAnimal = await this.animalRepo.update(existing.animalId, {
          reproStatus: novoStatus,
        });
        await this.outbox.enqueue(
          existing.farmId,
          'animals',
          existing.animalId,
          'UPDATE',
          updatedAnimal as unknown as Record<string, unknown>
        );
      });

      return ok(undefined);
    } catch (e: any) {
      return err(
        appError('DELETE_FAILED', e.message || 'Falha ao excluir inseminação.')
      );
    }
  }
}
