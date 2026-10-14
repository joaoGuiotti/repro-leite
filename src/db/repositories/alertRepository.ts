import { AlertRecord, CreateAlertDTO, getAlertsUseCases } from '@features/alerts';
import { DEFAULT_FARM_ID } from '@core/db';

export class AlertRepository {
  /**
   * Lista alertas pendentes de uma fazenda até uma determinada data canônica (YYYY-MM-DD).
   */
  static async listPendingByFarm(
    farmId: string,
    upToDate?: string
  ): Promise<AlertRecord[]> {
    const res = await getAlertsUseCases().listPendingUseCase.execute(farmId, upToDate);
    if (!res.ok) {
      throw new Error(res.error.message);
    }
    return res.value;
  }

  /**
   * Cria um novo alerta e registra na sync_queue.
   */
  static async create(data: CreateAlertDTO): Promise<AlertRecord> {
    const res = await getAlertsUseCases().createUseCase.execute(data);
    if (!res.ok) {
      throw new Error(res.error.message);
    }
    return res.value;
  }

  /**
   * Marca um alerta como concluído.
   */
  static async completeAlert(id: string): Promise<void> {
    const res = await getAlertsUseCases().completeUseCase.execute(id);
    if (!res.ok) {
      throw new Error(res.error.message);
    }
  }

  /**
   * Exclui logicamente todos os alertas associados a uma fonte (ex.: ID de inseminação cancelada).
   */
  static async softDeleteBySourceId(sourceId: string): Promise<void> {
    const res = await getAlertsUseCases().dismissUseCase.execute(DEFAULT_FARM_ID, sourceId);
    if (!res.ok) {
      throw new Error(res.error.message);
    }
  }
}
