import {
  BullOption,
  CowOption,
  CreateCalfDTO,
  CreateWeighingDTO,
  WeighingRecord,
} from './calves.types';

export interface CalfEnrichedRow {
  id: string;
  farmId: string;
  earTag: string;
  earTagNormalized: string;
  name?: string | null;
  breed: string;
  sex: 'femea' | 'macho';
  birthDate: string;
  birthWeightKg: number;
  lifeStage: 'bezerra' | 'novilha';
  reproStatus: string;
  exitStatus: string;
  sireId?: string | null;
  sireName?: string | null;
  damId?: string | null;
  damName?: string | null;
  damEarTag?: string | null;
  maternalGranddamName?: string | null;
  notes?: string | null;
  lastWeightKg?: number;
  lastWeightDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalvesRepository {
  // Consultas de Animais
  listCalvesByFarm(
    farmId: string,
    includeInactive?: boolean
  ): Promise<CalfEnrichedRow[]>;

  findCalfById(id: string): Promise<CalfEnrichedRow | null>;

  findByEarTag(
    farmId: string,
    earTagNormalized: string
  ): Promise<CalfEnrichedRow | null>;

  // Comandos de Animais
  saveCalf(calf: CreateCalfDTO): Promise<void>;
  updateCalf(id: string, updates: Partial<CreateCalfDTO>): Promise<void>;
  softDeleteCalf(id: string): Promise<void>;

  // Pesagens
  listWeighingsByAnimal(animalId: string): Promise<WeighingRecord[]>;
  saveWeighing(weighing: CreateWeighingDTO): Promise<void>;
  softDeleteWeighing(id: string): Promise<void>;

  // Opções para Cruzamento e Paternidade
  getAvailableBulls(farmId: string): Promise<BullOption[]>;
  getAvailableCows(farmId: string): Promise<CowOption[]>;
}

export interface CalvesOutboxEnqueuer {
  enqueue(
    farmId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payloadJson?: Record<string, unknown> | null
  ): Promise<void>;
}
