import { DEFAULT_FARM_ID } from '@core/db/client';
import { DrizzleTransactionRunner } from '@core/db/transaction';
import { OutboxRepository } from '@core/sync/outbox.repository';
import { syncEngine } from '@core/sync/sync-engine';
import { AnimalSqliteRepository } from '@features/herd';
import { BullSqliteRepository } from '@features/bulls';
import { getAlertsUseCases } from '@features/alerts';
import { InseminationSqliteRepository } from './infra/insemination.sqlite.repository';
import { RegisterInseminationUseCase } from './application/register-insemination.usecase';
import { ListRecentInseminationsUseCase } from './application/list-recent-inseminations.usecase';
import { DeleteInseminationUseCase } from './application/delete-insemination.usecase';

export interface InseminationUseCases {
  repo: InseminationSqliteRepository;
  registerUseCase: RegisterInseminationUseCase;
  listRecentUseCase: ListRecentInseminationsUseCase;
  deleteUseCase: DeleteInseminationUseCase;
}

let cachedUseCases: InseminationUseCases | null = null;

export function getInseminationUseCases(): InseminationUseCases {
  if (!cachedUseCases) {
    const repo = new InseminationSqliteRepository();
    const animalRepo = new AnimalSqliteRepository();
    const bullRepo = new BullSqliteRepository();
    const tx = new DrizzleTransactionRunner();
    const outbox = {
      enqueue: OutboxRepository.enqueue,
    };
    const alerts = getAlertsUseCases();
    const alertService = {
      create: async (data: any) => {
        const res = await alerts.createUseCase.execute(data);
        if (!res.ok) throw new Error(res.error.message);
      },
      softDeleteBySourceId: async (sourceId: string) => {
        const res = await alerts.dismissUseCase.execute(
          syncEngine.farmId || DEFAULT_FARM_ID,
          sourceId
        );
        if (!res.ok) throw new Error(res.error.message);
      },
    };

    cachedUseCases = {
      repo,
      registerUseCase: new RegisterInseminationUseCase(
        repo,
        animalRepo,
        bullRepo,
        alertService,
        outbox,
        tx
      ),
      listRecentUseCase: new ListRecentInseminationsUseCase(repo),
      deleteUseCase: new DeleteInseminationUseCase(
        repo,
        animalRepo,
        bullRepo,
        alertService,
        outbox,
        tx
      ),
    };
  }
  return cachedUseCases;
}
