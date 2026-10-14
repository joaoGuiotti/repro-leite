import { AnimalRecord, RegisterExitDTO } from './animal.entity';

export interface AnimalRepository {
  listByFarm(farmId: string, includeInactive?: boolean): Promise<AnimalRecord[]>;
  findById(id: string): Promise<AnimalRecord | null>;
  findByEarTag(
    farmId: string,
    earTagNormalized: string,
    onlyActive?: boolean
  ): Promise<AnimalRecord | null>;
  save(animal: AnimalRecord): Promise<void>;
  update(id: string, updates: Partial<AnimalRecord>): Promise<AnimalRecord>;
  registerExit(data: RegisterExitDTO): Promise<AnimalRecord>;
  reactivate(animalId: string): Promise<AnimalRecord>;
  softDelete(id: string): Promise<void>;
}
