import {
  calculateAverageDailyGain,
  calculateFeedingPlan,
  isReadyForFirstBreeding,
  TARGET_FIRST_BREEDING_WEIGHT_KG,
} from '../calves.entity';

describe('Calves Domain Rules', () => {
  describe('calculateFeedingPlan', () => {
    it('deve classificar fase inicial (0-15 dias) com 4 L/dia', () => {
      const plan0 = calculateFeedingPlan(0);
      expect(plan0.stage).toBe('inicial');
      expect(plan0.morningLiters).toBe(2);
      expect(plan0.afternoonLiters).toBe(2);

      const plan15 = calculateFeedingPlan(15);
      expect(plan15.stage).toBe('inicial');
      expect(plan15.litersPerDayDescription).toContain('4 L/dia');
    });

    it('deve classificar pico de aleitamento (16-100 dias) com 8 L/dia', () => {
      const plan16 = calculateFeedingPlan(16);
      expect(plan16.stage).toBe('pico');
      expect(plan16.morningLiters).toBe(4);
      expect(plan16.afternoonLiters).toBe(4);

      const plan100 = calculateFeedingPlan(100);
      expect(plan100.stage).toBe('pico');
      expect(plan100.litersPerDayDescription).toContain('8 L/dia');
    });

    it('deve classificar desmame gradual (101-121 dias)', () => {
      const plan101 = calculateFeedingPlan(101);
      expect(plan101.stage).toBe('desmame');
      expect(plan101.statusBadge).toBe('aviso');

      const plan121 = calculateFeedingPlan(121);
      expect(plan121.stage).toBe('desmame');
    });

    it('deve classificar desmamada a partir de 122 dias com 0 L', () => {
      const plan122 = calculateFeedingPlan(122);
      expect(plan122.stage).toBe('desmamada');
      expect(plan122.morningLiters).toBe(0);
      expect(plan122.afternoonLiters).toBe(0);

      const plan200 = calculateFeedingPlan(200);
      expect(plan200.stage).toBe('desmamada');
    });
  });

  describe('calculateAverageDailyGain', () => {
    it('deve calcular ganho médio diário em g/dia', () => {
      // 40 kg ao nascer -> 70 kg aos 30 dias = 30 kg em 30 dias = 1000 g/dia
      const gmd = calculateAverageDailyGain(40, 70, 30);
      expect(gmd).toBe(1000);
    });

    it('deve retornar 0 se dias decorridos for menor ou igual a 0', () => {
      expect(calculateAverageDailyGain(40, 50, 0)).toBe(0);
    });
  });

  describe('isReadyForFirstBreeding', () => {
    it('deve avaliar peso da novilha frente à meta de 360 kg', () => {
      expect(isReadyForFirstBreeding(359)).toBe(false);
      expect(isReadyForFirstBreeding(360)).toBe(true);
      expect(isReadyForFirstBreeding(380)).toBe(true);
      expect(isReadyForFirstBreeding(350, 340)).toBe(true);
      expect(TARGET_FIRST_BREEDING_WEIGHT_KG).toBe(360);
    });
  });
});
