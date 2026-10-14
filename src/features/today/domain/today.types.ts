import { AlertRecord } from '@features/alerts';

export interface AlertWithReproDetails extends AlertRecord {
  animalEarTag: string;
  animalName?: string | null;
  bullName?: string | null;
  inseminationDate?: string | null;
  daysSinceInsemination?: number;
  isOverdue: boolean;
}

export interface CalfTransitionItem {
  animalId: string;
  earTag: string;
  name?: string | null;
  ageInDays: number;
  stage: 'inicial' | 'pico' | 'desmame' | 'desmamada';
  phaseName: string;
  morningLiters: number;
  afternoonLiters: number;
  nextStepDays?: number;
  nextStepDescription?: string;
}

export interface CalfFeedingSummary {
  totalMorningLiters: number;
  totalAfternoonLiters: number;
  totalDailyLiters: number;
  activeCalvesCount: number;
  weaningCount: number;
  transitioningCalves: CalfTransitionItem[];
}

export type HeatObservationChoice =
  | 'held'
  | 'repeated_empty_only'
  | 'repeated_rebreed';

export type PregnancyDiagnosis = 'pregnant' | 'empty';

export interface TodayDashboardCounts {
  pendingHeat: number;
  pendingPregnancy: number;
  totalMorningLiters: number;
  totalAfternoonLiters: number;
  activeCalves: number;
}

export interface TodayDashboardData {
  referenceDate: string;
  isSimulated: boolean;
  heatAlerts: AlertWithReproDetails[];
  pregnancyAlerts: AlertWithReproDetails[];
  feedingSummary: CalfFeedingSummary;
  counts: TodayDashboardCounts;
}
