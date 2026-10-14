import { DrizzleTransactionRunner } from '@core/db/transaction';
import { OutboxRepository } from '@core/sync/outbox.repository';
import { BullSqliteRepository } from './infra/bull.sqlite.repository';
import { ListBullsUseCase } from './application/list-bulls.usecase';
import { RegisterBullUseCase } from './application/register-bull.usecase';
import { AdjustBullStrawsUseCase } from './application/adjust-bull-straws.usecase';

export interface BullsUseCases {
  repo: BullSqliteRepository;
  listUseCase: ListBullsUseCase;
  registerUseCase: RegisterBullUseCase;
  adjustUseCase: AdjustBullStrawsUseCase;
}

let cachedUseCases: BullsUseCases | null = null;

export function getBullsUseCases(): BullsUseCases {
  if (!cachedUseCases) {
    const repo = new BullSqliteRepository();
    const tx = new DrizzleTransactionRunner();
    const outbox = {
      enqueue: OutboxRepository.enqueue,
    };

    cachedUseCases = {
      repo,
      listUseCase: new ListBullsUseCase(repo),
      registerUseCase: new RegisterBullUseCase(repo, outbox, tx),
      adjustUseCase: new AdjustBullStrawsUseCase(repo, outbox, tx),
    };
  }
  return cachedUseCases;
}
