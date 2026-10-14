import { differenceInDays } from './calf-feeding';
import {
  GrowthMetrics,
  TARGET_FIRST_BREEDING_WEIGHT_KG,
  WEANING_AGE_DAYS,
  WeighingRecord,
} from './calves.types';

/**
 * Calcula o Ganho Médio Diário (GMD) em gramas por dia entre duas pesagens consecutivas.
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
 * Avalia o estágio de vida zootécnico com base na idade em dias.
 * Ao desmamar aos 122 dias, o animal transita automaticamente para novilha.
 */
export function evaluateLifeStage(ageInDays: number): 'bezerra' | 'novilha' {
  return ageInDays >= WEANING_AGE_DAYS ? 'novilha' : 'bezerra';
}

/**
 * Avalia se o animal é uma fêmea apta para a 1ª Inseminação Artificial (peso >= 360 kg).
 */
export function isReadyForFirstBreeding(
  weightKg: number,
  sex: 'femea' | 'macho',
  targetWeightKg: number = TARGET_FIRST_BREEDING_WEIGHT_KG
): boolean {
  if (sex !== 'femea') return false;
  return weightKg >= targetWeightKg;
}

/**
 * Calcula todas as métricas consolidadas de crescimento, GMD e prontidão reprodutiva a partir do histórico de pesagens.
 */
export function calculateGrowthMetrics(
  birthWeightKg: number,
  birthDate: string,
  weighings: WeighingRecord[],
  sex: 'femea' | 'macho'
): GrowthMetrics {
  // Ordena as pesagens por data crescente
  const sortedWeighings = [...weighings].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const lastWeighing = sortedWeighings[sortedWeighings.length - 1];
  const currentWeightKg = lastWeighing ? lastWeighing.weightKg : birthWeightKg;
  const lastWeighingDate = lastWeighing ? lastWeighing.date : birthDate;

  const totalWeightGainKg = Math.max(0, Number((currentWeightKg - birthWeightKg).toFixed(1)));

  // GMD do último período
  let dailyGainGramsPerDay = 0;
  if (sortedWeighings.length >= 2) {
    const penultWeighing = sortedWeighings[sortedWeighings.length - 2];
    const daysBetween = differenceInDays(lastWeighing.date, penultWeighing.date);
    dailyGainGramsPerDay = calculateAverageDailyGain(
      penultWeighing.weightKg,
      lastWeighing.weightKg,
      daysBetween
    );
  } else if (sortedWeighings.length === 1) {
    const daysFromBirth = differenceInDays(lastWeighing.date, birthDate);
    dailyGainGramsPerDay = calculateAverageDailyGain(
      birthWeightKg,
      lastWeighing.weightKg,
      daysFromBirth
    );
  }

  // GMD acumulado desde o nascimento
  const totalDays = Math.max(1, differenceInDays(lastWeighingDate, birthDate));
  const cumulativeDailyGainGramsPerDay = calculateAverageDailyGain(
    birthWeightKg,
    currentWeightKg,
    totalDays
  );

  const remainingKgToTarget = Math.max(
    0,
    Number((TARGET_FIRST_BREEDING_WEIGHT_KG - currentWeightKg).toFixed(1))
  );

  const progressPercentToTarget = Math.min(
    100,
    Math.round((currentWeightKg / TARGET_FIRST_BREEDING_WEIGHT_KG) * 100)
  );

  const isReady = isReadyForFirstBreeding(currentWeightKg, sex);

  return {
    currentWeightKg,
    birthWeightKg,
    totalWeightGainKg,
    dailyGainGramsPerDay,
    cumulativeDailyGainGramsPerDay,
    targetFirstBreedingWeightKg: TARGET_FIRST_BREEDING_WEIGHT_KG,
    remainingKgToTarget,
    progressPercentToTarget,
    isReadyForBreeding: isReady,
    lastWeighingDate,
  };
}
