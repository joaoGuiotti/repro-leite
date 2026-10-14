import { AppError, appError, err, ok, Result } from '@core/result';
import { generateId } from '@core/utils/id';
import { TransactionRunner } from '@core/db/transaction';
import { AlertRecord, CreateAlertDTO } from '../domain/alert.entity';
import { AlertRepository } from '../domain/alert.repository';

export interface OutboxEnqueuer {
  enqueue(
    farmId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payloadJson?: Record<string, unknown> | null
  ): Promise<void>;
}

export class CreateAlertUseCase {
  constructor(
    private repo: AlertRepository,
    private outbox: OutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(dto: CreateAlertDTO): Promise<Result<AlertRecord, AppError>> {
    if (!dto.farmId) {
      return err(appError('VALIDATION_ERROR', 'ID da fazenda é obrigatório.'));
    }
    if (!dto.targetAnimalId) {
      return err(appError('VALIDATION_ERROR', 'Animal de destino é obrigatório.'));
    }
    if (!dto.type) {
      return err(appError('VALIDATION_ERROR', 'Tipo de alerta é obrigatório.'));
    }
    if (!dto.dueDate) {
      return err(appError('VALIDATION_ERROR', 'Data de vencimento é obrigatória.'));
    }

    const now = new Date().toISOString();
    const id = generateId();

    const alert: AlertRecord = {
      id,
      farmId: dto.farmId,
      targetAnimalId: dto.targetAnimalId,
      type: dto.type,
      dueDate: dto.dueDate,
      completedAt: null,
      sourceId: dto.sourceId ?? null,
      notes: dto.notes ? dto.notes.trim() : null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    try {
      await this.tx.run(async () => {
        await this.repo.save(alert);
        await this.outbox.enqueue(
          dto.farmId,
          'alerts',
          id,
          'INSERT',
          alert as unknown as Record<string, unknown>
        );
      });

      return ok(alert);
    } catch (e: any) {
      return err(
        appError('SAVE_FAILED', e.message || 'Falha ao salvar alerta no banco local.')
      );
    }
  }
}
