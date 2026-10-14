import { AlertRecord, AlertWithAnimalSummary } from './alert.entity';

export interface AlertRepository {
  findById(id: string): Promise<AlertRecord | null>;
  listPendingByFarm(
    farmId: string,
    upToDate?: string
  ): Promise<AlertWithAnimalSummary[]>;
  save(alert: AlertRecord): Promise<void>;
  complete(id: string): Promise<void>;
  softDeleteBySourceId(sourceId: string): Promise<void>;
  softDelete(id: string): Promise<void>;
}
