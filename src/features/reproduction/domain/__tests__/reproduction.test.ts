import {
  calculateReproductiveMilestones,
  estimateGestationDays,
  isCalvingOverdue,
  OFFSET_PARTO_PREVISTO_DIAS,
  OFFSET_RETORNO_CIO_DIAS,
  OFFSET_SECAGEM_DIAS,
  OFFSET_TOQUE_VET_DIAS,
} from '../reproduction';

describe('Reproduction Domain Rules', () => {
  it('deve calcular marcos reprodutivos corretos a partir da data de IA', () => {
    const dataIA = '2026-01-01';
    const milestones = calculateReproductiveMilestones(dataIA);

    expect(milestones.heatDaysOffset).toBe(OFFSET_RETORNO_CIO_DIAS);
    expect(milestones.pregnancyCheckDaysOffset).toBe(OFFSET_TOQUE_VET_DIAS);
    expect(milestones.calvingDaysOffset).toBe(OFFSET_PARTO_PREVISTO_DIAS);
    expect(milestones.dryOffDaysOffset).toBe(OFFSET_SECAGEM_DIAS);

    expect(milestones.expectedHeatDate).toBe('2026-01-22');
    expect(milestones.pregnancyCheckDate).toBe('2026-02-15');
    expect(milestones.dryOffDate).toBe('2026-08-11');
    expect(milestones.expectedCalvingDate).toBe('2026-10-10');
  });

  it('deve estimar dias de gestação corretamente', () => {
    const dataIA = '2026-01-01';
    const hoje = '2026-01-31';

    const dias = estimateGestationDays(dataIA, hoje);
    expect(dias).toBe(30);
  });

  it('deve identificar se o parto está atrasado', () => {
    expect(isCalvingOverdue('2026-10-10', '2026-10-15')).toBe(true);
    expect(isCalvingOverdue('2026-10-10', '2026-10-05')).toBe(false);
    expect(isCalvingOverdue('2026-10-10', '2026-10-10')).toBe(false);
  });
});
