import {
  addDaysToIsoDate,
  differenceInDays,
  isHeatCheckInZootecnicWindow,
  isOverdueDate,
  isPregnancyCheckInZootecnicWindow,
} from '../today-filters';

describe('today-filters (Pure Domain Engine)', () => {
  describe('addDaysToIsoDate', () => {
    it('adiciona dias corretamente em formato YYYY-MM-DD', () => {
      expect(addDaysToIsoDate('2026-10-14', 3)).toBe('2026-10-17');
      expect(addDaysToIsoDate('2026-10-14', -3)).toBe('2026-10-11');
      expect(addDaysToIsoDate('2026-10-31', 1)).toBe('2026-11-01');
      expect(addDaysToIsoDate('2026-12-31', 1)).toBe('2027-01-01');
    });
  });

  describe('differenceInDays', () => {
    it('calcula a diferença de dias exata entre duas datas ISO', () => {
      expect(differenceInDays('2026-10-14', '2026-10-10')).toBe(4);
      expect(differenceInDays('2026-10-10', '2026-10-14')).toBe(-4);
      expect(differenceInDays('2026-10-14', '2026-10-14')).toBe(0);
    });
  });

  describe('isOverdueDate', () => {
    it('identifica corretamente datas vencidas', () => {
      expect(isOverdueDate('2026-10-13', '2026-10-14')).toBe(true);
      expect(isOverdueDate('2026-10-14', '2026-10-14')).toBe(false);
      expect(isOverdueDate('2026-10-15', '2026-10-14')).toBe(false);
    });
  });

  describe('isHeatCheckInZootecnicWindow', () => {
    const referenceDate = '2026-10-14';

    it('inclui alertas vencidos de dias anteriores', () => {
      expect(isHeatCheckInZootecnicWindow('2026-10-10', referenceDate)).toBe(true);
    });

    it('inclui alertas com vencimento no dia de hoje', () => {
      expect(isHeatCheckInZootecnicWindow('2026-10-14', referenceDate)).toBe(true);
    });

    it('inclui alertas com vencimento até 3 dias adiante (janela de observação de 18 a 21d)', () => {
      expect(isHeatCheckInZootecnicWindow('2026-10-17', referenceDate, 3)).toBe(true);
    });

    it('exclui alertas que vencem após a janela de tolerância (> 3 dias)', () => {
      expect(isHeatCheckInZootecnicWindow('2026-10-18', referenceDate, 3)).toBe(false);
      expect(isHeatCheckInZootecnicWindow('2026-10-25', referenceDate, 3)).toBe(false);
    });
  });

  describe('isPregnancyCheckInZootecnicWindow', () => {
    const referenceDate = '2026-10-14';

    it('inclui toques vencidos ou prontos para avaliação', () => {
      expect(isPregnancyCheckInZootecnicWindow('2026-10-01', referenceDate)).toBe(true);
      expect(isPregnancyCheckInZootecnicWindow('2026-10-14', referenceDate)).toBe(true);
    });

    it('inclui toques dentro da janela de antecedência permitida (padrão 5 dias)', () => {
      expect(isPregnancyCheckInZootecnicWindow('2026-10-19', referenceDate, 5)).toBe(true);
    });

    it('exclui toques além da janela de tolerância', () => {
      expect(isPregnancyCheckInZootecnicWindow('2026-10-20', referenceDate, 5)).toBe(false);
    });
  });
});
