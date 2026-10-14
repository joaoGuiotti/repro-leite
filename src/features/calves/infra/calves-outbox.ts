import { OutboxRepository } from '@core/sync/outbox.repository';
import { CalvesOutboxEnqueuer } from '../domain/calves.repository';

/**
 * Implementação da outbox para a feature Calves.
 * Encaminha as operações sincronizáveis para o OutboxRepository central do core.
 */
export class CalvesOutboxServiceImpl implements CalvesOutboxEnqueuer {
  async enqueue(
    farmId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payloadJson?: Record<string, unknown> | null
  ): Promise<void> {
    await OutboxRepository.enqueue(
      farmId,
      tableName,
      recordId,
      operation,
      payloadJson
    );
  }
}
