import { DrizzleTransactionRunner } from '@core/db/transaction';
import { OutboxRepository } from '@core/sync/outbox.repository';
import { SettingSqliteRepository } from './infra/setting.sqlite.repository';
import { GetSettingsUseCase } from './application/get-settings.usecase';
import { UpdateSettingUseCase } from './application/update-setting.usecase';

export interface SettingsUseCases {
  repo: SettingSqliteRepository;
  getUseCase: GetSettingsUseCase;
  updateUseCase: UpdateSettingUseCase;
}

let cachedUseCases: SettingsUseCases | null = null;

export function getSettingsUseCases(): SettingsUseCases {
  if (!cachedUseCases) {
    const repo = new SettingSqliteRepository();
    const tx = new DrizzleTransactionRunner();
    const outbox = {
      enqueue: OutboxRepository.enqueue,
    };

    cachedUseCases = {
      repo,
      getUseCase: new GetSettingsUseCase(repo),
      updateUseCase: new UpdateSettingUseCase(repo, outbox, tx),
    };
  }

  return cachedUseCases;
}
