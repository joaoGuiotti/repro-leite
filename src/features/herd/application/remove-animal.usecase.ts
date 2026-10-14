import { AppError, appError, err, ok, Result } from '@core/result';
import { TransactionRunner } from '@core/db/transaction';
import { AnimalRecord, RegisterExitDTO } from '../domain/animal.entity';
import { AnimalRepository } from '../domain/animal.repository';
import { OutboxEnqueuer } from './register-animal.usecase';

export class RemoveAnimalUseCase {
  constructor(
    private repo: AnimalRepository,
    private outbox: OutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async registerExit(input: RegisterExitDTO): Promise<Result<AnimalRecord, AppError>> {
    const existing = await this.repo.findById(input.animalId);
    if (!existing) {
      return err(appError('ANIMAL_NOT_FOUND', `Animal ${input.animalId} não encontrado.`));
    }

    if (existing.exitStatus !== 'ativo') {
      return err(appError('ANIMAL_NOT_ACTIVE', 'Animal já se encontra inativo no rebanho.'));
    }

    try {
      let updated: AnimalRecord | null = null;
      await this.tx.run(async () => {
        updated = await this.repo.registerExit(input);
        await this.outbox.enqueue(
          existing.farmId,
          'animals',
          existing.id,
          'UPDATE',
          updated as unknown as Record<string, unknown>
        );
      });
      return ok(updated!);
    } catch (e: any) {
      return err(appError('EXIT_FAILED', e.message || 'Falha ao registrar saída do animal.'));
    }
  }

  async reactivate(animalId: string): Promise<Result<AnimalRecord, AppError>> {
    const existing = await this.repo.findById(animalId);
    if (!existing) {
      return err(appError('ANIMAL_NOT_FOUND', `Animal ${animalId} não encontrado.`));
    }

    if (existing.exitStatus === 'ativo') {
      return ok(existing);
    }

    // Verifica se já existe outro animal ativo com o mesmo brinco
    const activeSameEarTag = await this.repo.findByEarTag(
      existing.farmId,
      existing.earTagNormalized,
      true
    );
    if (activeSameEarTag && activeSameEarTag.id !== existing.id) {
      return err(
        appError(
          'EAR_TAG_CONFLICT',
          'Não é possível reativar: já existe outro animal ativo com este mesmo brinco.'
        )
      );
    }

    try {
      let updated: AnimalRecord | null = null;
      await this.tx.run(async () => {
        updated = await this.repo.reactivate(animalId);
        await this.outbox.enqueue(
          existing.farmId,
          'animals',
          existing.id,
          'UPDATE',
          updated as unknown as Record<string, unknown>
        );
      });
      return ok(updated!);
    } catch (e: any) {
      return err(appError('REACTIVATE_FAILED', e.message || 'Falha ao reativar animal.'));
    }
  }

  async softDelete(id: string): Promise<Result<void, AppError>> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      return err(appError('ANIMAL_NOT_FOUND', `Animal ${id} não encontrado.`));
    }

    try {
      await this.tx.run(async () => {
        await this.repo.softDelete(id);
        await this.outbox.enqueue(existing.farmId, 'animals', id, 'DELETE', null);
      });
      return ok(undefined);
    } catch (e: any) {
      return err(appError('DELETE_FAILED', e.message || 'Falha ao excluir animal.'));
    }
  }
}
