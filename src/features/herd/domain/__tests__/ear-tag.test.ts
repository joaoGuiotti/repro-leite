import { normalizeEarTag, evaluateEarTagAvailability } from '../ear-tag';
import { AnimalSummary } from '../animal.entity';

describe('Domain: earTag (Normalização e Política de Reuso)', () => {
  describe('normalizeEarTag', () => {
    test('Deve remover espaços em branco nas extremidades e converter para maiúsculo', () => {
      expect(normalizeEarTag(' 104 ')).toBe('104');
      expect(normalizeEarTag('a104')).toBe('A104');
      expect(normalizeEarTag(' a-12 ')).toBe('A12');
      expect(normalizeEarTag('br-001')).toBe('BR001');
    });

    test('Deve lidar com números puros e caracteres especiais', () => {
      expect(normalizeEarTag('054')).toBe('054');
      expect(normalizeEarTag('12/A')).toBe('12A');
      expect(normalizeEarTag('')).toBe('');
    });
  });

  describe('evaluateEarTagAvailability (Política de Reuso)', () => {
    const existingAnimals: AnimalSummary[] = [
      {
        id: 'uuid-1',
        earTag: '104',
        earTagNormalized: '104',
        name: 'Mimosa',
        exitStatus: 'ativo',
        deletedAt: null,
      },
      {
        id: 'uuid-2',
        earTag: '120',
        earTagNormalized: '120',
        name: 'Estrela',
        exitStatus: 'vendido',
        exitDate: '2024-05-15',
        deletedAt: null,
      },
      {
        id: 'uuid-3',
        earTag: '300',
        earTagNormalized: '300',
        name: 'Excluída por engano',
        exitStatus: 'ativo',
        deletedAt: '2024-01-01T00:00:00Z',
      },
    ];

    test('Deve retornar "disponivel" para brinco inédito', () => {
      const result = evaluateEarTagAvailability(existingAnimals, '999');
      expect(result.status).toBe('disponivel');
      expect(result.normalizedTag).toBe('999');
      expect(result.currentAnimal).toBeUndefined();
    });

    test('Deve retornar "bloqueado_ativo" para brinco pertencente a animal ativo', () => {
      const result = evaluateEarTagAvailability(existingAnimals, ' 104 ');
      expect(result.status).toBe('bloqueado_ativo');
      expect(result.normalizedTag).toBe('104');
      expect(result.currentAnimal?.id).toBe('uuid-1');
      expect(result.currentAnimal?.name).toBe('Mimosa');
      expect(result.message).toContain('Mimosa');
    });

    test('Deve permitir o mesmo brinco ao editar o próprio animal (mesmo ID)', () => {
      const result = evaluateEarTagAvailability(existingAnimals, '104', 'uuid-1');
      expect(result.status).toBe('disponivel');
    });

    test('Deve retornar "alerta_reuso_inativo" para brinco de animal inativo (vendido/morto)', () => {
      const result = evaluateEarTagAvailability(existingAnimals, '120');
      expect(result.status).toBe('alerta_reuso_inativo');
      expect(result.normalizedTag).toBe('120');
      expect(result.pastAnimal?.id).toBe('uuid-2');
      expect(result.pastAnimal?.name).toBe('Estrela');
      expect(result.message).toContain('Estrela');
    });

    test('Deve retornar "alerta_reuso_inativo" ou liberado para animal excluído logicamente (soft delete)', () => {
      const result = evaluateEarTagAvailability(existingAnimals, '300');
      // Registro excluído libera o brinco com alerta histórico
      expect(result.status).toBe('alerta_reuso_inativo');
      expect(result.pastAnimal?.id).toBe('uuid-3');
    });
  });
});
