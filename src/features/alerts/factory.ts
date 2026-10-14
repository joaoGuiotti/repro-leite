import { DrizzleTransactionRunner } from '@core/db/transaction';
import { OutboxRepository } from '@core/sync/outbox.repository';
import { AlertSqliteRepository } from './infra/alert.sqlite.repository';
import { ListPendingAlertsUseCase } from './application/list-pending-alerts.usecase';
import { CreateAlertUseCase } from './application/create-alert.usecase';
import { CompleteAlertUseCase } from './application/complete-alert.usecase';
import { DismissAlertsBySourceUseCase } from './application/dismiss-alerts-by-source.usecase';

export interface AlertsUseCases {
  repo: AlertSqliteRepository;
  listPendingUseCase: ListPendingAlertsUseCase;
  createUseCase: CreateAlertUseCase;
  completeUseCase: CompleteAlertUseCase;
  dismissUseCase: DismissAlertsBySourceUseCase;
}

let cachedUseCases: AlertsUseCases | null = null;

export function getAlertsUseCases(): AlertsUseCases {
  if (!cachedUseCases) {
    const repo = new AlertSqliteRepository();
    const tx = new DrizzleTransactionRunner();
    const outbox = {
      enqueue: OutboxRepository.enqueue,
    };

    cachedUseCases = {
      repo,
      listPendingUseCase: new ListPendingAlertsUseCase(repo),
      createUseCase: new CreateAlertUseCase(repo, outbox, tx),
      completeUseCase: new CompleteAlertUseCase(repo, outbox, tx),
      dismissUseCase: new DismissAlertsBySourceUseCase(repo, outbox, tx),
    };
  }

  return cachedUseCases;
}
