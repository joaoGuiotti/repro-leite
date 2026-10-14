export type FeedingStage = 'inicial' | 'pico' | 'desmame' | 'desmamada';

export interface FeedingPlan {
  stage: FeedingStage;
  phaseName: string;
  litersPerDayDescription: string;
  morningLiters: number;
  afternoonLiters: number;
  statusBadge: 'prenhe' | 'inseminada' | 'aviso' | 'secada';
}

export const TARGET_FIRST_BREEDING_WEIGHT_KG = 360;

/**
 * Calcula a fase de aleitamento e o volume diário de leite recomendado com base na idade em dias.
 */
export function calculateFeedingPlan(ageInDays: number): FeedingPlan {
  const dias = Math.max(0, Math.floor(ageInDays));

  if (dias >= 16 && dias <= 100) {
    return {
      stage: 'pico',
      phaseName: 'Pico de Aleitamento',
      litersPerDayDescription: '8 L/dia (4L manhã + 4L tarde)',
      morningLiters: 4,
      afternoonLiters: 4,
      statusBadge: 'prenhe',
    };
  }

  if (dias >= 101 && dias <= 121) {
    return {
      stage: 'desmame',
      phaseName: 'Desmame Gradual (Corte)',
      litersPerDayDescription: 'Corte semanal progressivo',
      morningLiters: 2,
      afternoonLiters: 2,
      statusBadge: 'aviso',
    };
  }

  if (dias >= 122) {
    return {
      stage: 'desmamada',
      phaseName: 'Desmamada',
      litersPerDayDescription: '0 L (Apenas pasto/ração)',
      morningLiters: 0,
      afternoonLiters: 0,
      statusBadge: 'secada',
    };
  }

  // 0 a 15 dias: fase inicial
  return {
    stage: 'inicial',
    phaseName: 'Inicial',
    litersPerDayDescription: '4 L/dia (2L manhã + 2L tarde)',
    morningLiters: 2,
    afternoonLiters: 2,
    statusBadge: 'inseminada',
  };
}

/**
 * Calcula o Ganho Médio Diário (GMD) em gramas por dia entre duas pesagens.
 */
export function calculateAverageDailyGain(
  startWeightKg: number,
  currentWeightKg: number,
  daysElapsed: number
): number {
  if (daysElapsed <= 0) return 0;
  const gainKg = currentWeightKg - startWeightKg;
  const gainGramsPerDay = (gainKg / daysElapsed) * 1000;
  return Math.round(gainGramsPerDay);
}

/**
 * Avalia se uma novilha atingiu a meta de peso zootécnico para a 1ª Inseminação Artificial.
 */
export function isReadyForFirstBreeding(
  weightKg: number,
  targetWeightKg: number = TARGET_FIRST_BREEDING_WEIGHT_KG
): boolean {
  return weightKg >= targetWeightKg;
}
