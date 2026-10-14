import { BaseEntity } from '@/db/schema/common';

export type AnimalSex = 'femea' | 'macho';

export type AnimalLifeStage =
  | 'lactante'
  | 'desmamada'
  | 'recria'
  | 'novilha_apta_ia'
  | 'novilha_prenhe'
  | 'adulta';

export type AnimalReproStatus =
  | 'vazia'
  | 'inseminada'
  | 'prenhe'
  | 'seca'
  | 'nao_se_aplica';

export type AnimalExitStatus =
  | 'ativo'
  | 'vendido'
  | 'descartado'
  | 'morto';

export interface AnimalRecord extends BaseEntity {
  earTag: string;
  earTagNormalized: string;
  name?: string | null;
  breed: string;
  sex: AnimalSex;
  birthDate: string; // ISO YYYY-MM-DD
  birthWeightKg: number;
  lifeStage: AnimalLifeStage;
  reproStatus: AnimalReproStatus;
  exitStatus: AnimalExitStatus;
  exitDate?: string | null;
  exitReason?: string | null;
  sireId?: string | null;
  sireName?: string | null;
  damId?: string | null;
  damName?: string | null;
  maternalGrandsireName?: string | null;
  paternalGrandsireName?: string | null;
  notes?: string | null;
}

export interface AnimalSummary {
  id: string;
  earTag: string;
  earTagNormalized: string;
  name?: string | null;
  breed?: string;
  sex?: AnimalSex;
  lifeStage?: AnimalLifeStage;
  reproStatus?: AnimalReproStatus;
  exitStatus: AnimalExitStatus;
  exitDate?: string | null;
  sireId?: string | null;
  sireName?: string | null;
  damId?: string | null;
  damName?: string | null;
  maternalGrandsireName?: string | null;
  paternalGrandsireName?: string | null;
  deletedAt?: string | null;
}

export type EarTagAvailabilityStatus =
  | 'disponivel'
  | 'bloqueado_ativo'
  | 'alerta_reuso_inativo';

export interface EarTagEvaluationResult {
  status: EarTagAvailabilityStatus;
  normalizedTag: string;
  currentAnimal?: AnimalSummary;
  pastAnimal?: AnimalSummary;
  message?: string;
}

export interface AnimalFilterOptions {
  query?: string;
  reproStatus?: 'todas' | 'vazia' | 'inseminada' | 'prenhe' | 'seca';
  showInactive?: boolean;
}

export interface CreateAnimalDTO {
  farmId: string;
  earTag: string;
  name?: string | null;
  breed: string;
  sex: AnimalSex;
  birthDate: string; // YYYY-MM-DD
  birthWeightKg?: number;
  lifeStage?: AnimalLifeStage;
  reproStatus?: AnimalReproStatus;
  sireId?: string | null;
  sireName?: string | null;
  damId?: string | null;
  damName?: string | null;
  maternalGrandsireName?: string | null;
  paternalGrandsireName?: string | null;
  notes?: string | null;
}

export interface RegisterExitDTO {
  animalId: string;
  exitStatus: 'vendido' | 'descartado' | 'morto';
  exitDate: string; // YYYY-MM-DD
  exitReason?: string | null;
}
