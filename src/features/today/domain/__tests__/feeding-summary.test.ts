import { calculateDailyFeedingSummary, getCalfFeedingStage } from '../feeding-summary';

describe('feeding-summary (Pure Domain Engine)', () => {
  describe('getCalfFeedingStage', () => {
    it('retorna fase inicial para bezerras de 0 a 15 dias (4 L/dia)', () => {
      const plan = getCalfFeedingStage(5);
      expect(plan.stage).toBe('inicial');
      expect(plan.morningLiters).toBe(2);
      expect(plan.afternoonLiters).toBe(2);
    });

    it('retorna pico de aleitamento para bezerras de 16 a 100 dias (8 L/dia)', () => {
      const plan = getCalfFeedingStage(45);
      expect(plan.stage).toBe('pico');
      expect(plan.morningLiters).toBe(4);
      expect(plan.afternoonLiters).toBe(4);
    });

    it('retorna desmame gradual para bezerras de 101 a 121 dias (4 L/dia corte)', () => {
      const plan = getCalfFeedingStage(110);
      expect(plan.stage).toBe('desmame');
      expect(plan.morningLiters).toBe(2);
      expect(plan.afternoonLiters).toBe(2);
    });

    it('retorna desmamada para bezerras acima de 122 dias (0 L/dia)', () => {
      const plan = getCalfFeedingStage(125);
      expect(plan.stage).toBe('desmamada');
      expect(plan.morningLiters).toBe(0);
      expect(plan.afternoonLiters).toBe(0);
    });
  });

  describe('calculateDailyFeedingSummary', () => {
    const referenceDate = '2026-10-14';

    it('retorna zeros com segurança para lista vazia de animais', () => {
      const summary = calculateDailyFeedingSummary([], referenceDate);
      expect(summary.totalMorningLiters).toBe(0);
      expect(summary.totalAfternoonLiters).toBe(0);
      expect(summary.totalDailyLiters).toBe(0);
      expect(summary.activeCalvesCount).toBe(0);
      expect(summary.weaningCount).toBe(0);
      expect(summary.transitioningCalves).toHaveLength(0);
    });

    it('soma corretamente litros de diferentes fases (machos e fêmeas) e ignora inativos', () => {
      const calves = [
        {
          id: 'c1',
          earTag: '10',
          name: 'Bezerra 1',
          sex: 'femea' as const,
          birthDate: '2026-10-04', // 10 dias -> inicial (2L + 2L)
          exitStatus: 'ativo',
        },
        {
          id: 'c2',
          earTag: '20',
          name: 'Bezerra 2',
          sex: 'femea' as const,
          birthDate: '2026-09-04', // 40 dias -> pico (4L + 4L)
          exitStatus: 'ativo',
        },
        {
          id: 'c3',
          earTag: '30',
          name: 'Bezerra 3',
          sex: 'femea' as const,
          birthDate: '2026-06-25', // 111 dias -> desmame (2L + 2L)
          exitStatus: 'ativo',
        },
        {
          id: 'c4',
          earTag: '40',
          name: 'Bezerra Desmamada',
          sex: 'femea' as const,
          birthDate: '2026-05-01', // 166 dias -> desmamada (0L)
          exitStatus: 'ativo',
        },
        {
          id: 'm1',
          earTag: '99',
          name: 'Bezerro Macho',
          sex: 'macho' as const,
          birthDate: '2026-10-04', // 10 dias -> inicial (2L + 2L)
          exitStatus: 'ativo',
        },
        {
          id: 'c5',
          earTag: '50',
          name: 'Bezerra Vendida',
          sex: 'femea' as const,
          birthDate: '2026-10-04',
          exitStatus: 'vendido',
        },
      ];

      const summary = calculateDailyFeedingSummary(calves, referenceDate);

      // c1 (2+2) + c2 (4+4) + c3 (2+2) + m1 (2+2) = 10L manhã + 10L tarde = 20L total
      expect(summary.totalMorningLiters).toBe(10);
      expect(summary.totalAfternoonLiters).toBe(10);
      expect(summary.totalDailyLiters).toBe(20);
      expect(summary.activeCalvesCount).toBe(4);
      expect(summary.weaningCount).toBe(1);
      expect(summary.transitioningCalves).toHaveLength(1);
      expect(summary.transitioningCalves[0].earTag).toBe('30');
    });

    it('identifica bezerras que entrarão em corte na semana (94 a 100 dias)', () => {
      const calves = [
        {
          id: 'c-quase-corte',
          earTag: '95',
          name: 'Quase Corte',
          sex: 'femea' as const,
          birthDate: '2026-07-08', // 98 dias
          exitStatus: 'ativo',
        },
      ];

      const summary = calculateDailyFeedingSummary(calves, referenceDate);
      expect(summary.transitioningCalves).toHaveLength(1);
      expect(summary.transitioningCalves[0].nextStepDays).toBe(3);
      expect(summary.transitioningCalves[0].nextStepDescription).toContain('Início do corte gradual em 3 dias');
    });
  });
});
