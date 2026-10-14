import {
  calculateReproductiveMilestones,
  resolveAnimalReproStatusAfterCancellation,
} from '../../src/domain/reproduction';
import { InseminationRecord } from '../../src/types/insemination';

describe('Domain: reproduction (Cálculo Puro dos Marcos Reprodutivos)', () => {
  test('calculateReproductiveMilestones deve calcular os 4 marcos corretamente a partir da data da IA', () => {
    const milestones = calculateReproductiveMilestones('2026-10-14');

    expect(milestones.expectedHeatDate).toBe('2026-11-04'); // +21 dias
    expect(milestones.pregnancyCheckDate).toBe('2026-11-28'); // +45 dias
    expect(milestones.expectedCalvingDate).toBe('2027-07-23'); // +282 dias (~9 meses)
    expect(milestones.dryOffDate).toBe('2027-05-24'); // Parto - 60 dias (+222 dias)

    expect(milestones.heatDaysOffset).toBe(21);
    expect(milestones.pregnancyCheckDaysOffset).toBe(45);
    expect(milestones.calvingDaysOffset).toBe(282);
    expect(milestones.dryOffDaysOffset).toBe(222);
  });

  test('calculateReproductiveMilestones deve funcionar através da virada de ano', () => {
    const milestones = calculateReproductiveMilestones('2026-12-15');

    expect(milestones.expectedHeatDate).toBe('2027-01-05'); // +21 dias
    expect(milestones.pregnancyCheckDate).toBe('2027-01-29'); // +45 dias
    expect(milestones.expectedCalvingDate).toBe('2027-09-23'); // +282 dias
    expect(milestones.dryOffDate).toBe('2027-07-25'); // +222 dias
  });

  test('calculateReproductiveMilestones deve tratar ano bissexto corretamente', () => {
    const milestones = calculateReproductiveMilestones('2024-02-10');

    // 2024 é bissexto (fevereiro tem 29 dias)
    // 10/02 + 21 dias = 02/03/2024
    expect(milestones.expectedHeatDate).toBe('2024-03-02');
  });

  describe('resolveAnimalReproStatusAfterCancellation', () => {
    test('deve retornar "vazia" se não houver histórico restante', () => {
      expect(resolveAnimalReproStatusAfterCancellation([])).toBe('vazia');
    });

    test('deve retornar "inseminada" se houver outra IA anterior ativa com resultado pendente', () => {
      const mockHistory: InseminationRecord[] = [
        {
          id: 'ia-1',
          farmId: 'farm-1',
          animalId: 'vaca-1',
          bullId: 'bull-1',
          bullName: 'Jaguar',
          date: '2026-09-01',
          inseminator: 'João',
          expectedHeatDate: '2026-09-22',
          pregnancyCheckDate: '2026-10-16',
          expectedCalvingDate: '2027-06-10',
          dryOffDate: '2027-04-11',
          result: 'pendente',
          createdAt: '2026-09-01T10:00:00Z',
          updatedAt: '2026-09-01T10:00:00Z',
          deletedAt: null,
        },
      ];

      expect(resolveAnimalReproStatusAfterCancellation(mockHistory)).toBe(
        'inseminada'
      );
    });

    test('deve retornar "vazia" se as IAs anteriores tiverem resultado "vazia" (cio confirmado negativo)', () => {
      const mockHistory: InseminationRecord[] = [
        {
          id: 'ia-1',
          farmId: 'farm-1',
          animalId: 'vaca-1',
          bullId: 'bull-1',
          bullName: 'Jaguar',
          date: '2026-08-01',
          inseminator: 'João',
          expectedHeatDate: '2026-08-22',
          pregnancyCheckDate: '2026-09-15',
          expectedCalvingDate: '2027-05-10',
          dryOffDate: '2027-03-11',
          result: 'vazia',
          createdAt: '2026-08-01T10:00:00Z',
          updatedAt: '2026-08-01T10:00:00Z',
          deletedAt: null,
        },
      ];

      expect(resolveAnimalReproStatusAfterCancellation(mockHistory)).toBe(
        'vazia'
      );
    });
  });
});
