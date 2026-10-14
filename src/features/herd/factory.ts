import { DrizzleTransactionRunner } from '@core/db/transaction';
import { OutboxRepository } from '@core/sync/outbox.repository';
import { AnimalSqliteRepository } from './infra/animal.sqlite.repository';
import { ListAnimalsUseCase } from './application/list-animals.usecase';
import { RegisterAnimalUseCase } from './application/register-animal.usecase';
import { RemoveAnimalUseCase } from './application/remove-animal.usecase';

export interface HerdUseCases {
  repo: AnimalSqliteRepository;
  listUseCase: ListAnimalsUseCase;
  registerUseCase: RegisterAnimalUseCase;
  removeUseCase: RemoveAnimalUseCase;
}

let cachedUseCases: HerdUseCases | null = null;

export function getHerdUseCases(): HerdUseCases {
  if (!cachedUseCases) {
    const repo = new AnimalSqliteRepository();
    const tx = new DrizzleTransactionRunner();
    const outbox = {
      enqueue: OutboxRepository.enqueue,
    };

    cachedUseCases = {
      repo,
      listUseCase: new ListAnimalsUseCase(repo),
      registerUseCase: new RegisterAnimalUseCase(repo, outbox, tx),
      removeUseCase: new RemoveAnimalUseCase(repo, outbox, tx),
    };
  }
  return cachedUseCases;
}
