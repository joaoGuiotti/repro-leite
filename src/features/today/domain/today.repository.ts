import { CalfFeedingInputAnimal } from './feeding-summary';
import { AlertWithReproDetails } from './today.types';

/**
 * Contrato (port) para enfileiramento de operações na outbox para sincronização.
 */
export interface TodayOutboxEnqueuer {
  enqueue(
    farmId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payloadJson?: Record<string, unknown> | null
  ): Promise<void>;
}

/**
 * Contrato (port) do repositório da feature Today.
 * Centraliza as operações de leitura enriquecida e escrita no curral.
 */
export interface TodayRepository {
  // Consultas
  getPendingAlertsEnriched(
    farmId: string,
    referenceDate: string
  ): Promise<AlertWithReproDetails[]>;

  listAnimalsForFeeding(
    farmId: string
  ): Promise<CalfFeedingInputAnimal[]>;

  // Comandos
  completeAlert(id: string): Promise<void>;

  cancelAlertsBySourceId(sourceId: string): Promise<void>;

  updateAnimalReproStatus(
    animalId: string,
    status: 'vazia' | 'inseminada' | 'prenhe' | 'seca'
  ): Promise<void>;

  updateInseminationResult(
    inseminationId: string,
    result: 'pendente' | 'prenhe' | 'vazia'
  ): Promise<void>;
}
