export type FeedingStage =
  | 'inicial'
  | 'pico'
  | 'desmame_semana1'
  | 'desmame_semana2'
  | 'desmame_semana3'
  | 'desmamada';

export const TARGET_FIRST_BREEDING_WEIGHT_KG = 360;
export const DEFAULT_BIRTH_WEIGHT_KG = 40.0;
export const WEANING_AGE_DAYS = 122;

export interface CalfFeedingPlan {
  stage: FeedingStage;
  phaseName: string; // Ex: "Fase Inicial (Adaptação)", "Pico de Aleitamento", etc.
  ageInDays: number;
  ageInMonths: number;
  morningLiters: number;
  afternoonLiters: number;
  totalDailyLiters: number;
  badgeLabel: string; // "4L/dia", "8L/dia", "2L/dia", "1L/dia", "0L/dia"
  badgeVariant: 'prenhe' | 'inseminada' | 'aviso' | 'secada';
  daysUntilNextChange: number;
  nextChangeDate?: string; // YYYY-MM-DD
}

export interface WeaningMilestone {
  dayNumber: number; // 1, 16, 101, 108, 115, 122
  date: string; // YYYY-MM-DD
  title: string; // Ex: "Nascimento & Colostro", "Pico de Aleitamento"
  description: string;
  litersDescription: string; // Ex: "4L/dia", "8L/dia", "Desmamada"
  isCurrent: boolean;
  isPast: boolean;
}

export interface WeighingRecord {
  id: string;
  farmId: string;
  animalId: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  notes?: string | null;
  createdAt: string;
}

export interface GrowthMetrics {
  currentWeightKg: number;
  birthWeightKg: number;
  totalWeightGainKg: number;
  dailyGainGramsPerDay: number; // GMD do último período (g/dia)
  cumulativeDailyGainGramsPerDay: number; // GMD desde o nascimento
  targetFirstBreedingWeightKg: number; // Padrão: 360 kg
  remainingKgToTarget: number;
  progressPercentToTarget: number; // 0 a 100%
  isReadyForBreeding: boolean; // true se >= 360 kg e fêmea
  lastWeighingDate: string;
}

export interface CalfListItem {
  id: string;
  farmId: string;
  earTag: string;
  name?: string | null;
  sex: 'femea' | 'macho';
  breed: string;
  birthDate: string;
  birthWeightKg: number;
  lifeStage: 'bezerra' | 'novilha';
  reproStatus: string;
  sireName?: string | null;
  damName?: string | null;
  // Métricas calculadas para o cartão
  ageInDays: number;
  ageInMonths: number;
  feedingStage: FeedingStage;
  phaseName: string;
  dailyLiters: number;
  lastWeightKg?: number;
  isReadyForBreeding: boolean;
}

export interface CalfWithDetails {
  id: string;
  farmId: string;
  earTag: string;
  name?: string | null;
  sex: 'femea' | 'macho';
  breed: string;
  birthDate: string;
  birthWeightKg: number;
  lifeStage: 'bezerra' | 'novilha';
  reproStatus: string;
  // Linhagem genealógica
  sireId?: string | null;
  sireName?: string | null;
  damId?: string | null;
  damName?: string | null;
  damEarTag?: string | null;
  maternalGranddamName?: string | null;
  notes?: string | null;
  // Cálculos dinâmicos
  feedingPlan: CalfFeedingPlan;
  weaningTimeline: WeaningMilestone[];
  growthMetrics?: GrowthMetrics;
  weighingsHistory: WeighingRecord[];
}

export interface CreateCalfDTO {
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
  maternalGrandsireName?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWeighingDTO {
  id: string;
  farmId: string;
  animalId: string;
  date: string;
  weightKg: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BullOption {
  id: string;
  name: string;
  breed?: string | null;
}

export interface CowOption {
  id: string;
  earTag: string;
  name?: string | null;
  maternalGranddamName?: string | null;
}

