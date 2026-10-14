import { adjustBullStock, hasAvailableStraws } from '../bull-stock';

describe('Domain: bullStock (Estoque de Doses de Sêmen)', () => {
  describe('adjustBullStock', () => {
    test('Deve incrementar doses corretamente', () => {
      expect(adjustBullStock(10, 5)).toBe(15);
      expect(adjustBullStock(0, 1)).toBe(1);
    });

    test('Deve decrementar doses corretamente', () => {
      expect(adjustBullStock(10, -3)).toBe(7);
      expect(adjustBullStock(1, -1)).toBe(0);
    });

    test('Deve bloquear e lançar erro quando ajuste resultar em saldo negativo', () => {
      expect(() => adjustBullStock(2, -3)).toThrow('O estoque de doses não pode ser inferior a zero.');
      expect(() => adjustBullStock(0, -1)).toThrow('O estoque de doses não pode ser inferior a zero.');
    });

    test('Deve rejeitar valores não inteiros', () => {
      expect(() => adjustBullStock(10, 1.5)).toThrow('A quantidade de doses deve ser um número inteiro.');
    });
  });

  describe('hasAvailableStraws', () => {
    test('Deve retornar true quando houver doses disponíveis', () => {
      expect(hasAvailableStraws(1)).toBe(true);
      expect(hasAvailableStraws(20)).toBe(true);
    });

    test('Deve retornar false quando estoque estiver zerado ou negativo', () => {
      expect(hasAvailableStraws(0)).toBe(false);
      expect(hasAvailableStraws(-1)).toBe(false);
    });
  });
});
