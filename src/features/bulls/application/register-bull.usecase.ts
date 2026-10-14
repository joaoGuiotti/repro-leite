import { AppError, appError, err, ok, Result } from '@core/result';
import { generateId } from '@core/utils/id';
import { TransactionRunner } from '@core/db/transaction';
import { BullRecord, CreateBullDTO } from '../domain/bull.entity';
import { BullRepository } from '../domain/bull.repository';

export interface OutboxEnqueuer {
  enqueue(
    farmId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payloadJson?: Record<string, unknown> | null
  ): Promise<void>;
}

export class RegisterBullUseCase {
  constructor(
    private repo: BullRepository,
    private outbox: OutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(input: CreateBullDTO): Promise<Result<BullRecord, AppError>> {
    const name = input.name ? input.name.trim() : '';
    if (!name) {
      return err(appError('INVALID_NAME', 'O nome do touro é obrigatório.'));
    }

    const breed = input.breed ? input.breed.trim() : '';
    if (!breed) {
      return err(appError('INVALID_BREED', 'A raça do touro é obrigatória.'));
    }

    const strawsInStock = Math.max(0, input.strawsInStock ?? 0);
    const now = new Date().toISOString();
    const id = generateId();

    const bull: BullRecord = {
      id,
      farmId: input.farmId,
      name,
      breed,
      code: input.code ? input.code.trim() : null,
      strawsInStock,
      notes: input.notes ? input.notes.trim() : null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    try {
      await this.tx.run(async () => {
        await this.repo.save(bull);
        await this.outbox.enqueue(
          bull.farmId,
          'bulls',
          bull.id,
          'INSERT',
          bull as unknown as Record<string, unknown>
        );
      });
      return ok(bull);
    } catch (e: any) {
      return err(appError('SAVE_FAILED', e.message || 'Falha ao salvar touro no catálogo.'));
    }
  }
}
