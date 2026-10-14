import {
  calculateCalfFeedingPlan,
  generateWeaningTimeline,
} from '../calf-feeding';

describe('calf-feeding domain engine', () => {
  const birthDate = '2026-11-11';

  it('calcula estágio Inicial (0 a 15 dias): 4L/dia (2L + 2L)', () => {
    // 13 dias depois: 2026-11-24
    const plan = calculateCalfFeedingPlan(birthDate, '2026-11-24');

    expect(plan.ageInDays).toBe(13);
    expect(plan.stage).toBe('inicial');
    expect(plan.morningLiters).toBe(2);
    expect(plan.afternoonLiters).toBe(2);
    expect(plan.totalDailyLiters).toBe(4);
    expect(plan.badgeLabel).toBe('4L/dia');
    expect(plan.daysUntilNextChange).toBe(3); // faltam 3 dias para o dia 16 (27/11/2026)
    expect(plan.nextChangeDate).toBe('2026-11-27');
  });

  it('calcula estágio Pico de Aleitamento (16 a 100 dias): 8L/dia (4L + 4L)', () => {
    // 50 dias depois: 2026-12-31
    const plan = calculateCalfFeedingPlan(birthDate, '2026-12-31');

    expect(plan.ageInDays).toBe(50);
    expect(plan.stage).toBe('pico');
    expect(plan.morningLiters).toBe(4);
    expect(plan.afternoonLiters).toBe(4);
    expect(plan.totalDailyLiters).toBe(8);
    expect(plan.badgeLabel).toBe('8L/dia');
  });

  it('calcula estágio Desmame - 1ª Semana (101 a 107 dias): 4L/dia (2L + 2L)', () => {
    // 101 dias depois: 2027-02-20
    const plan = calculateCalfFeedingPlan(birthDate, '2027-02-20');

    expect(plan.ageInDays).toBe(101);
    expect(plan.stage).toBe('desmame_semana1');
    expect(plan.morningLiters).toBe(2);
    expect(plan.afternoonLiters).toBe(2);
    expect(plan.totalDailyLiters).toBe(4);
  });

  it('calcula estágio Desmame - 2ª Semana (108 a 114 dias): 2L/dia (1L + 1L)', () => {
    // 108 dias depois: 2027-02-27
    const plan = calculateCalfFeedingPlan(birthDate, '2027-02-27');

    expect(plan.ageInDays).toBe(108);
    expect(plan.stage).toBe('desmame_semana2');
    expect(plan.morningLiters).toBe(1);
    expect(plan.afternoonLiters).toBe(1);
    expect(plan.totalDailyLiters).toBe(2);
  });

  it('calcula estágio Desmame - 3ª Semana (115 a 121 dias): 1L/dia (1L Manhã)', () => {
    // 115 dias depois: 2027-03-06
    const plan = calculateCalfFeedingPlan(birthDate, '2027-03-06');

    expect(plan.ageInDays).toBe(115);
    expect(plan.stage).toBe('desmame_semana3');
    expect(plan.morningLiters).toBe(1);
    expect(plan.afternoonLiters).toBe(0);
    expect(plan.totalDailyLiters).toBe(1);
  });

  it('calcula estágio Desmamada (122+ dias): 0L/dia', () => {
    // 122 dias depois: 2027-03-13
    const plan = calculateCalfFeedingPlan(birthDate, '2027-03-13');

    expect(plan.ageInDays).toBe(122);
    expect(plan.stage).toBe('desmamada');
    expect(plan.morningLiters).toBe(0);
    expect(plan.afternoonLiters).toBe(0);
    expect(plan.totalDailyLiters).toBe(0);
    expect(plan.daysUntilNextChange).toBe(0);
  });

  it('gera linha do tempo de desmame com exatamente 6 marcos e datas calculadas', () => {
    const timeline = generateWeaningTimeline(birthDate, '2026-11-24'); // 13 dias

    expect(timeline).toHaveLength(6);
    expect(timeline[0].dayNumber).toBe(1);
    expect(timeline[0].date).toBe('2026-11-11');
    expect(timeline[0].isCurrent).toBe(true);

    expect(timeline[1].dayNumber).toBe(16);
    expect(timeline[1].date).toBe('2026-11-27');
    expect(timeline[1].isPast).toBe(false);

    expect(timeline[2].dayNumber).toBe(101);
    expect(timeline[2].date).toBe('2027-02-20');

    expect(timeline[3].dayNumber).toBe(108);
    expect(timeline[3].date).toBe('2027-02-27');

    expect(timeline[4].dayNumber).toBe(115);
    expect(timeline[4].date).toBe('2027-03-06');

    expect(timeline[5].dayNumber).toBe(122);
    expect(timeline[5].date).toBe('2027-03-13');
  });
});
