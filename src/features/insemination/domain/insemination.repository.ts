import {
  InseminationRecord,
  InseminationWithAnimalSummary,
} from './insemination.entity';

export interface InseminationRepository {
  listRecentByFarm(
    farmId: string,
    limit?: number
  ): Promise<InseminationWithAnimalSummary[]>;
  listByAnimal(animalId: string): Promise<InseminationRecord[]>;
  findById(id: string): Promise<InseminationRecord | null>;
  save(insemination: InseminationRecord): Promise<void>;
  update(
    id: string,
    updates: Partial<InseminationRecord>
  ): Promise<InseminationRecord>;
  softDelete(id: string): Promise<void>;
}
