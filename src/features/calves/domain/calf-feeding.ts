import {
  CalfFeedingPlan,
  FeedingStage,
  WeaningMilestone,
} from './calves.types';

/**
 * Calcula a diferença em dias civis inteiros entre duas datas no formato YYYY-MM-DD (UTC).
 */
export function differenceInDays(endDateStr: string, startDateStr: string): number {
  const t1 = Date.parse(`${endDateStr.slice(0, 10)}T00:00:00Z`);
  const t2 = Date.parse(`${startDateStr.slice(0, 10)}T00:00:00Z`);
  if (isNaN(t1) || isNaN(t2)) return 0;
  return Math.floor((t1 - t2) / (1000 * 60 * 60 * 24));
}

/**
 * Adiciona um número de dias a uma data YYYY-MM-DD retornando nova data ISO YYYY-MM-DD.
 */
export function addDays(dateStr: string, days: number): string {
  const t = Date.parse(`${dateStr.slice(0, 10)}T00:00:00Z`);
  const result = new Date(t + days * 86400000);
  return result.toISOString().slice(0, 10);
}

/**
 * Calcula o plano de aleitamento e volume de leite recomendado para a bezerra na data de referência.
 */
export function calculateCalfFeedingPlan(
  birthDate: string,
  referenceDate: string
): CalfFeedingPlan {
  const ageInDays = Math.max(0, differenceInDays(referenceDate, birthDate));
  const ageInMonths = Number((ageInDays / 30.4375).toFixed(1));

  let stage: FeedingStage = 'inicial';
  let phaseName = 'Fase Inicial (Adaptação)';
  let morningLiters = 2;
  let afternoonLiters = 2;
  let totalDailyLiters = 4;
  let badgeLabel = '4L/dia';
  let badgeVariant: CalfFeedingPlan['badgeVariant'] = 'inseminada';
  let daysUntilNextChange = 0;
  let nextChangeDate: string | undefined;

  if (ageInDays <= 15) {
    stage = 'inicial';
    phaseName = 'Fase Inicial (Adaptação)';
    morningLiters = 2;
    afternoonLiters = 2;
    totalDailyLiters = 4;
    badgeLabel = '4L/dia';
    badgeVariant = 'inseminada';
    daysUntilNextChange = 16 - ageInDays;
    nextChangeDate = addDays(birthDate, 16);
  } else if (ageInDays <= 100) {
    stage = 'pico';
    phaseName = 'Pico de Aleitamento';
    morningLiters = 4;
    afternoonLiters = 4;
    totalDailyLiters = 8;
    badgeLabel = '8L/dia';
    badgeVariant = 'prenhe';
    daysUntilNextChange = 101 - ageInDays;
    nextChangeDate = addDays(birthDate, 101);
  } else if (ageInDays <= 107) {
    stage = 'desmame_semana1';
    phaseName = 'Desmame - 1ª Semana de Corte';
    morningLiters = 2;
    afternoonLiters = 2;
    totalDailyLiters = 4;
    badgeLabel = '4L/dia';
    badgeVariant = 'aviso';
    daysUntilNextChange = 108 - ageInDays;
    nextChangeDate = addDays(birthDate, 108);
  } else if (ageInDays <= 114) {
    stage = 'desmame_semana2';
    phaseName = 'Desmame - 2ª Semana de Corte';
    morningLiters = 1;
    afternoonLiters = 1;
    totalDailyLiters = 2;
    badgeLabel = '2L/dia';
    badgeVariant = 'aviso';
    daysUntilNextChange = 115 - ageInDays;
    nextChangeDate = addDays(birthDate, 115);
  } else if (ageInDays <= 121) {
    stage = 'desmame_semana3';
    phaseName = 'Desmame - 3ª Semana de Corte';
    morningLiters = 1;
    afternoonLiters = 0;
    totalDailyLiters = 1;
    badgeLabel = '1L/dia';
    badgeVariant = 'aviso';
    daysUntilNextChange = 122 - ageInDays;
    nextChangeDate = addDays(birthDate, 122);
  } else {
    stage = 'desmamada';
    phaseName = 'Bezerra Desmamada';
    morningLiters = 0;
    afternoonLiters = 0;
    totalDailyLiters = 0;
    badgeLabel = '0L/dia';
    badgeVariant = 'secada';
    daysUntilNextChange = 0;
    nextChangeDate = undefined;
  }

  return {
    stage,
    phaseName,
    ageInDays,
    ageInMonths,
    morningLiters,
    afternoonLiters,
    totalDailyLiters,
    badgeLabel,
    badgeVariant,
    daysUntilNextChange,
    nextChangeDate,
  };
}

/**
 * Gera os 6 marcos exatos do cronograma de desmame projetados no calendário.
 */
export function generateWeaningTimeline(
  birthDate: string,
  referenceDate: string
): WeaningMilestone[] {
  const ageInDays = Math.max(0, differenceInDays(referenceDate, birthDate));

  const milestonesData = [
    {
      dayNumber: 1,
      offset: 0,
      title: 'Nascimento & Colostro',
      description: 'Ingestão de colostro nas primeiras 6h e início da fase 2L + 2L',
      litersDescription: '4L/dia',
      startDay: 0,
      endDay: 15,
    },
    {
      dayNumber: 16,
      offset: 16,
      title: 'Pico de Aleitamento',
      description: 'Aumento para 4L de manhã e 4L à tarde (8L/dia)',
      litersDescription: '8L/dia',
      startDay: 16,
      endDay: 100,
    },
    {
      dayNumber: 101,
      offset: 101,
      title: 'Desmame: 1ª Semana',
      description: 'Reduz para 2L de manhã e 2L à tarde (4L/dia)',
      litersDescription: '4L/dia',
      startDay: 101,
      endDay: 107,
    },
    {
      dayNumber: 108,
      offset: 108,
      title: 'Desmame: 2ª Semana',
      description: 'Reduz para 1L de manhã e 1L à tarde (2L/dia)',
      litersDescription: '2L/dia',
      startDay: 108,
      endDay: 114,
    },
    {
      dayNumber: 115,
      offset: 115,
      title: 'Desmame: 3ª Semana',
      description: 'Apenas 1L pela manhã (1L/dia)',
      litersDescription: '1L/dia',
      startDay: 115,
      endDay: 121,
    },
    {
      dayNumber: 122,
      offset: 122,
      title: 'Desmame Completo',
      description: 'Corte total do leite. Ração, feno e água à vontade',
      litersDescription: 'Desmamada',
      startDay: 122,
      endDay: 99999,
    },
  ];

  return milestonesData.map((m) => {
    const isCurrent = ageInDays >= m.startDay && ageInDays <= m.endDay;
    const isPast = ageInDays > m.endDay;
    const date = addDays(birthDate, m.offset);

    return {
      dayNumber: m.dayNumber,
      date,
      title: m.title,
      description: m.description,
      litersDescription: m.litersDescription,
      isCurrent,
      isPast,
    };
  });
}
