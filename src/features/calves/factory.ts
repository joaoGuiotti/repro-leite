import { DrizzleTransactionRunner } from '@core/db/transaction';
import { CalvesOutboxServiceImpl } from './infra/calves-outbox';
import { CalvesRepositoryImpl } from './infra/calves.repository.impl';
import { ListCalvesUseCase } from './application/list-calves.usecase';
import { GetCalfDetailsUseCase } from './application/get-calf-details.usecase';
import { RegisterCalfUseCase } from './application/register-calf.usecase';
import { RecordWeighingUseCase } from './application/record-weighing.usecase';
import { DeleteCalfUseCase } from './application/delete-calf.usecase';
import { GetBreedingOptionsUseCase } from './application/get-breeding-options.usecase';

export interface CalvesUseCases {
  listCalvesUseCase: ListCalvesUseCase;
  getCalfDetailsUseCase: GetCalfDetailsUseCase;
  registerCalfUseCase: RegisterCalfUseCase;
  recordWeighingUseCase: RecordWeighingUseCase;
  deleteCalfUseCase: DeleteCalfUseCase;
  getBreedingOptionsUseCase: GetBreedingOptionsUseCase;
}

let cachedUseCases: CalvesUseCases | null = null;

/**
 * Composition Root para a feature Calves (Bezerras & Recria).
 * Instancia repositórios, serviços de outbox e injeta nos casos de uso.
 */
export function getCalvesUseCases(): CalvesUseCases {
  if (!cachedUseCases) {
    const repo = new CalvesRepositoryImpl();
    const outbox = new CalvesOutboxServiceImpl();
    const tx = new DrizzleTransactionRunner();

    cachedUseCases = {
      listCalvesUseCase: new ListCalvesUseCase(repo),
      getCalfDetailsUseCase: new GetCalfDetailsUseCase(repo),
      registerCalfUseCase: new RegisterCalfUseCase(repo, outbox, tx),
      recordWeighingUseCase: new RecordWeighingUseCase(repo, outbox, tx),
      deleteCalfUseCase: new DeleteCalfUseCase(repo, outbox, tx),
      getBreedingOptionsUseCase: new GetBreedingOptionsUseCase(repo),
    };
  }

  return cachedUseCases;
}
