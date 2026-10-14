import { checkConsanguinity } from '../../src/domain/consanguinity';

describe('Domain: consanguinity (Detecção Determinística de Parentesco)', () => {
  test('deve detectar consanguinidade de 1º grau quando o touro for pai pelo ID', () => {
    const female = {
      sireId: 'bull-10',
      sireName: 'Jaguar TE',
    };
    const bull = {
      id: 'bull-10',
      name: 'Jaguar TE',
    };

    const result = checkConsanguinity(female, bull);
    expect(result.isConsanguineous).toBe(true);
    expect(result.degree).toBe('1st_degree');
    expect(result.relation).toBe('pai');
    expect(result.warningMessage).toContain('pai');
  });

  test('deve detectar consanguinidade de 1º grau quando o touro for pai pelo nome normalizado', () => {
    const female = {
      sireName: '  jaguar te  ',
    };
    const bull = {
      name: 'Jaguar TE',
    };

    const result = checkConsanguinity(female, bull);
    expect(result.isConsanguineous).toBe(true);
    expect(result.degree).toBe('1st_degree');
    expect(result.relation).toBe('pai');
  });

  test('deve detectar consanguinidade de 2º grau quando o touro for avô materno', () => {
    const female = {
      sireName: 'Outro Touro',
      maternalGrandsireName: 'Estanho de Brasília',
    };
    const bull = {
      name: 'Estanho de Brasília',
    };

    const result = checkConsanguinity(female, bull);
    expect(result.isConsanguineous).toBe(true);
    expect(result.degree).toBe('2nd_degree');
    expect(result.relation).toBe('avo_materno');
    expect(result.warningMessage).toContain('avô');
  });

  test('deve detectar consanguinidade de 2º grau quando o touro for avô paterno', () => {
    const female = {
      sireName: 'Outro Touro',
      paternalGrandsireName: 'Radar dos Poções',
    };
    const bull = {
      name: 'Radar dos Poções',
    };

    const result = checkConsanguinity(female, bull);
    expect(result.isConsanguineous).toBe(true);
    expect(result.degree).toBe('2nd_degree');
    expect(result.relation).toBe('avo_paterno');
  });

  test('deve retornar isConsanguineous = false quando não houver parentesco', () => {
    const female = {
      sireName: 'Touro A',
      maternalGrandsireName: 'Touro B',
    };
    const bull = {
      name: 'Touro C Totalmente Distinto',
    };

    const result = checkConsanguinity(female, bull);
    expect(result.isConsanguineous).toBe(false);
    expect(result.degree).toBeUndefined();
  });

  test('deve retornar isConsanguineous = false quando a fêmea não tiver genealogia informada', () => {
    const female = {};
    const bull = {
      id: 'bull-1',
      name: 'Touro Qualquer',
    };

    const result = checkConsanguinity(female, bull);
    expect(result.isConsanguineous).toBe(false);
  });
});
