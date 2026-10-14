import { OutboxRepository } from '@core/sync/outbox.repository';
import { TodayOutboxEnqueuer } from '../domain/today.repository';

/**
 * Implementação da outbox para a feature Today.
 * Encaminha as operações sincronizáveis para o OutboxRepository central do core.
 */
export class TodayOutboxServiceImpl implements TodayOutboxEnqueuer {
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
