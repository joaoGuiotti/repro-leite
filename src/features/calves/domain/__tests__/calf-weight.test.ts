import {
  calculateAverageDailyGain,
  calculateGrowthMetrics,
  evaluateLifeStage,
  isReadyForFirstBreeding,
} from '../calf-weight';

describe('calf-weight domain engine', () => {
  it('calcula GMD (Ganho Médio Diário) em g/dia corretamente', () => {
    // 30 kg em 30 dias -> 1000 g/dia
    expect(calculateAverageDailyGain(41, 71, 30)).toBe(1000);

    // Perda de peso: -3 kg em 10 dias -> -300 g/dia
    expect(calculateAverageDailyGain(71, 68, 10)).toBe(-300);

    // Dias zero ou negativo -> 0
    expect(calculateAverageDailyGain(41, 41, 0)).toBe(0);
  });

  it('avalia transição de estágio de vida (lifeStage: bezerra -> novilha)', () => {
    expect(evaluateLifeStage(13)).toBe('bezerra');
    expect(evaluateLifeStage(100)).toBe('bezerra');
    expect(evaluateLifeStage(121)).toBe('bezerra');
    expect(evaluateLifeStage(122)).toBe('novilha');
    expect(evaluateLifeStage(300)).toBe('novilha');
  });

  it('avalia se novilha está apta para a 1ª Inseminação Artificial (>= 360 kg)', () => {
    expect(isReadyForFirstBreeding(328, 'femea')).toBe(false);
    expect(isReadyForFirstBreeding(360, 'femea')).toBe(true);
    expect(isReadyForFirstBreeding(365, 'femea')).toBe(true);
    expect(isReadyForFirstBreeding(365, 'macho')).toBe(false);
  });

  it('calcula métricas completas de crescimento e progresso até a meta', () => {
    const birthDate = '2026-11-11';
    const birthWeightKg = 41;
    const weighings = [
      {
        id: 'w1',
        farmId: 'farm-1',
        animalId: 'calf-1',
        date: '2026-11-11',
        weightKg: 41,
        notes: 'Ao nascer',
        createdAt: '2026-11-11T00:00:00Z',
      },
      {
        id: 'w2',
        farmId: 'farm-1',
        animalId: 'calf-1',
        date: '2026-12-11',
        weightKg: 71,
        notes: '30 dias',
        createdAt: '2026-12-11T00:00:00Z',
      },
    ];

    const metrics = calculateGrowthMetrics(
      birthWeightKg,
      birthDate,
      weighings,
      'femea'
    );

    expect(metrics.currentWeightKg).toBe(71);
    expect(metrics.birthWeightKg).toBe(41);
    expect(metrics.totalWeightGainKg).toBe(30);
    expect(metrics.dailyGainGramsPerDay).toBe(1000);
    expect(metrics.targetFirstBreedingWeightKg).toBe(360);
    expect(metrics.remainingKgToTarget).toBe(289);
    expect(metrics.progressPercentToTarget).toBe(20);
    expect(metrics.isReadyForBreeding).toBe(false);
  });

  it('sinaliza apta para IA quando fêmea atinge 360 kg', () => {
    const metrics = calculateGrowthMetrics(
      40,
      '2025-09-01',
      [
        {
          id: 'w1',
          farmId: 'farm-1',
          animalId: 'heifer-1',
          date: '2026-10-14',
          weightKg: 365,
          notes: 'Pesagem de cobertura',
          createdAt: '2026-10-14T00:00:00Z',
        },
      ],
      'femea'
    );

    expect(metrics.currentWeightKg).toBe(365);
    expect(metrics.remainingKgToTarget).toBe(0);
    expect(metrics.progressPercentToTarget).toBe(100);
    expect(metrics.isReadyForBreeding).toBe(true);
  });
});
