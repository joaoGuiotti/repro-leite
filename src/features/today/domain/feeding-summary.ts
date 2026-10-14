import { differenceInDays } from './today-filters';
import { CalfFeedingSummary, CalfTransitionItem } from './today.types';

export interface CalfFeedingInputAnimal {
  id: string;
  earTag: string;
  name?: string | null;
  sex: 'femea' | 'macho';
  birthDate: string; // YYYY-MM-DD
  exitStatus: string;
}

/**
 * Calcula o plano alimentar individual de uma bezerra com base na idade em dias.
 */
export function getCalfFeedingStage(ageInDays: number): {
  stage: 'inicial' | 'pico' | 'desmame' | 'desmamada';
  phaseName: string;
  morningLiters: number;
  afternoonLiters: number;
} {
  const dias = Math.max(0, Math.floor(ageInDays));

  if (dias >= 16 && dias <= 100) {
    return {
      stage: 'pico',
      phaseName: 'Pico de Aleitamento',
      morningLiters: 4,
      afternoonLiters: 4,
    };
  }

  if (dias >= 101 && dias <= 121) {
    return {
      stage: 'desmame',
      phaseName: 'Desmame Gradual (Corte)',
      morningLiters: 2,
      afternoonLiters: 2,
    };
  }

  if (dias >= 122) {
    return {
      stage: 'desmamada',
      phaseName: 'Desmamada',
      morningLiters: 0,
      afternoonLiters: 0,
    };
  }

  return {
    stage: 'inicial',
    phaseName: 'Fase Inicial',
    morningLiters: 2,
    afternoonLiters: 2,
  };
}

/**
 * Consolida o volume total de leite diário do bezerreiro e lista bezerras em semana de corte ou transição.
 */
export function calculateDailyFeedingSummary(
  calves: CalfFeedingInputAnimal[],
  referenceDate: string
): CalfFeedingSummary {
  let totalMorningLiters = 0;
  let totalAfternoonLiters = 0;
  let activeCalvesCount = 0;
  let weaningCount = 0;
  const transitioningCalves: CalfTransitionItem[] = [];

  for (const calf of calves) {
    // Apenas fêmeas ativas e com menos de 180 dias de vida entram no cálculo do bezerreiro
    if (calf.exitStatus !== 'ativo' || calf.sex !== 'femea') {
      continue;
    }

    const ageInDays = differenceInDays(referenceDate, calf.birthDate);
    if (ageInDays < 0 || ageInDays > 180) {
      continue;
    }

    const plan = getCalfFeedingStage(ageInDays);

    // Contabiliza como bezerra em aleitamento se ainda consome leite
    if (ageInDays < 122) {
      activeCalvesCount++;
      totalMorningLiters += plan.morningLiters;
      totalAfternoonLiters += plan.afternoonLiters;
    }

    if (plan.stage === 'desmame') {
      weaningCount++;
    }

    // Bezerras em desmame (101-121d) ou prestes a entrar em desmame nos próximos 7 dias (94-100d)
    const isTransitioning = ageInDays >= 94 && ageInDays <= 121;
    if (isTransitioning) {
      let nextStepDays = 0;
      let nextStepDescription = '';

      if (ageInDays <= 100) {
        nextStepDays = 101 - ageInDays;
        nextStepDescription = `Início do corte gradual em ${nextStepDays} ${nextStepDays === 1 ? 'dia' : 'dias'}`;
      } else {
        nextStepDays = 122 - ageInDays;
        nextStepDescription = `Desmame total em ${nextStepDays} ${nextStepDays === 1 ? 'dia' : 'dias'}`;
      }

      transitioningCalves.push({
        animalId: calf.id,
        earTag: calf.earTag,
        name: calf.name,
        ageInDays,
        stage: plan.stage,
        phaseName: plan.phaseName,
        morningLiters: plan.morningLiters,
        afternoonLiters: plan.afternoonLiters,
        nextStepDays,
        nextStepDescription,
      });
    }
  }

  // Ordena bezerras em transição pela proximidade do próximo marco
  transitioningCalves.sort((a, b) => (a.nextStepDays ?? 0) - (b.nextStepDays ?? 0));

  return {
    totalMorningLiters,
    totalAfternoonLiters,
    totalDailyLiters: totalMorningLiters + totalAfternoonLiters,
    activeCalvesCount,
    weaningCount,
    transitioningCalves,
  };
}
