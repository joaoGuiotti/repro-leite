import { advanceDays } from '@core/simulation';
import {
  InseminationMilestones,
  InseminationRecord,
} from '@/types/insemination';

export const OFFSET_RETORNO_CIO_DIAS = 21;
export const OFFSET_TOQUE_VET_DIAS = 45;
export const OFFSET_PARTO_PREVISTO_DIAS = 282;
export const OFFSET_SECAGEM_DIAS = 222; // 282 - 60 dias

/**
 * Calcula deterministicamente os marcos reprodutivos a partir da data da IA.
 * Não depende de fuso horário nem de APIs nativas do dispositivo.
 */
export function calculateReproductiveMilestones(
  inseminationDate: string
): InseminationMilestones {
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
 * Determina o novo status reprodutivo de um animal após o cancelamento/exclusão de uma IA.
 * Se houver outra IA anterior ativa (sem desfecho negativo 'vazia'), retorna 'inseminada'.
 * Caso contrário, retorna 'vazia'.
 */
export function resolveAnimalReproStatusAfterCancellation(
  activeHistory: InseminationRecord[]
): 'vazia' | 'inseminada' {
  if (!activeHistory || activeHistory.length === 0) {
    return 'vazia';
  }

  // Verifica se há alguma inseminação ativa cujo resultado não seja 'vazia'
  const temIAAberta = activeHistory.some(
    (ia) => !ia.deletedAt && (ia.result === 'pendente' || ia.result === 'prenhe')
  );

  return temIAAberta ? 'inseminada' : 'vazia';
}
