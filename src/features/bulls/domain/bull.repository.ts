import { BullRecord } from './bull.entity';

export interface BullRepository {
  listByFarm(farmId: string): Promise<BullRecord[]>;
  findById(id: string): Promise<BullRecord | null>;
  save(bull: BullRecord): Promise<void>;
  update(id: string, updates: Partial<BullRecord>): Promise<BullRecord>;
  adjustStraws(id: string, delta: number): Promise<BullRecord>;
  softDelete(id: string): Promise<void>;
}
