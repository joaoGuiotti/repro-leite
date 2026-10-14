import { AppError, appError, err, ok, Result } from '@core/result';
import { TransactionRunner } from '@core/db/transaction';
import { SettingRepository } from '../domain/setting.repository';

export interface OutboxEnqueuer {
  enqueue(
    farmId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payloadJson?: Record<string, unknown> | null
  ): Promise<void>;
}

export class UpdateSettingUseCase {
  constructor(
    private repo: SettingRepository,
    private outbox: OutboxEnqueuer,
    private tx: TransactionRunner
  ) {}

  async execute(
    farmId: string,
    key: string,
    value: string
  ): Promise<Result<void, AppError>> {
    if (!farmId) {
      return err(appError('VALIDATION_ERROR', 'ID da fazenda é obrigatório.'));
    }
    if (!key || !key.trim()) {
      return err(appError('VALIDATION_ERROR', 'Chave da configuração é obrigatória.'));
    }

    try {
      await this.tx.run(async () => {
        await this.repo.set(farmId, key.trim(), value);
        await this.outbox.enqueue(
          farmId,
          'settings',
          `${farmId}_${key.trim()}`,
          'UPDATE',
          { key: key.trim(), value }
        );
      });

      return ok(undefined);
    } catch (e: any) {
      return err(
        appError('SAVE_FAILED', e.message || 'Falha ao salvar configuração.')
      );
    }
  }
}
