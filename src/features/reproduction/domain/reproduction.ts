import { advanceDays } from '@core/simulation/date-simulation';

export const OFFSET_RETORNO_CIO_DIAS = 21;
export const OFFSET_TOQUE_VET_DIAS = 45;
export const OFFSET_PARTO_PREVISTO_DIAS = 282;
export const OFFSET_SECAGEM_DIAS = 222; // 282 - 60 dias

export interface ReproductiveMilestones {
  expectedHeatDate: string; // +21 dias
  pregnancyCheckDate: string; // +45 dias
  expectedCalvingDate: string; // +282 dias
  dryOffDate: string; // +222 dias (60 dias pré-parto)
  heatDaysOffset: number;
  pregnancyCheckDaysOffset: number;
  calvingDaysOffset: number;
  dryOffDaysOffset: number;
}

/**
 * Calcula deterministicamente os marcos reprodutivos a partir da data da IA.
 * Não depende de fuso horário nem de APIs nativas do dispositivo.
 */
export function calculateReproductiveMilestones(
  inseminationDate: string
): ReproductiveMilestones {
  const expectedHeatDate = advanceDays(
    inseminationDate,
    OFFSET_RETORNO_CIO_DIAS
  );
  const pregnancyCheckDate = advanceDays(
    inseminationDate,
    OFFSET_TOQUE_VET_DIAS
  );
  const expectedCalvingDate = advanceDays(
    inseminationDate,
    OFFSET_PARTO_PREVISTO_DIAS
  );
  const dryOffDate = advanceDays(inseminationDate, OFFSET_SECAGEM_DIAS);

  return {
    expectedHeatDate,
    pregnancyCheckDate,
    expectedCalvingDate,
    dryOffDate,
    heatDaysOffset: OFFSET_RETORNO_CIO_DIAS,
    pregnancyCheckDaysOffset: OFFSET_TOQUE_VET_DIAS,
    calvingDaysOffset: OFFSET_PARTO_PREVISTO_DIAS,
    dryOffDaysOffset: OFFSET_SECAGEM_DIAS,
  };
}

/**
 * Calcula os dias decorridos de gestação entre a inseminação e uma data de referência.
 */
export function estimateGestationDays(
  inseminationDate: string,
  referenceDate: string
): number {
  if (!inseminationDate || !referenceDate) return 0;
  const dInsem = new Date(inseminationDate);
  const dRef = new Date(referenceDate);
  const diffTime = dRef.getTime() - dInsem.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Verifica se a gestação está atrasada em relação à data prevista de parto.
 */
export function isCalvingOverdue(
  expectedCalvingDate: string,
  referenceDate: string
): boolean {
  if (!expectedCalvingDate || !referenceDate) return false;
  return referenceDate > expectedCalvingDate;
}
