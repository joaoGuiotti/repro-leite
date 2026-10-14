import { filterAnimals } from '../animal-filters';
import { AnimalSummary } from '../animal.entity';

describe('Domain: animalFilters', () => {
  const mockAnimals: AnimalSummary[] = [
    {
      id: '1',
      earTag: '101',
      earTagNormalized: '101',
      name: 'Mimosa',
      breed: 'Holandesa',
      sex: 'femea',
      reproStatus: 'vazia',
      exitStatus: 'ativo',
    },
    {
      id: '2',
      earTag: '102',
      earTagNormalized: '102',
      name: 'Estrela',
      breed: 'Girolando',
      sex: 'femea',
      reproStatus: 'prenhe',
      exitStatus: 'ativo',
    },
    {
      id: '3',
      earTag: '103',
      earTagNormalized: '103',
      name: 'Pintada',
      breed: 'Jersey',
      sex: 'femea',
      reproStatus: 'inseminada',
      exitStatus: 'ativo',
    },
    {
      id: '4',
      earTag: '104',
      earTagNormalized: '104',
      name: 'Barão (Touro)',
      breed: 'Gir Leiteiro',
      sex: 'macho',
      reproStatus: 'nao_se_aplica',
      exitStatus: 'ativo',
    },
    {
      id: '5',
      earTag: '99',
      earTagNormalized: '99',
      name: 'Antiga',
      breed: 'Holandesa',
      sex: 'femea',
      reproStatus: 'seca',
      exitStatus: 'vendido',
      exitDate: '2024-03-10',
    },
  ];

  test('Deve retornar todos os animais ativos quando nenhum filtro for passado', () => {
    const result = filterAnimals(mockAnimals, {});
    expect(result.length).toBe(4);
    expect(result.map((a) => a.id)).toEqual(['1', '2', '3', '4']);
  });

  test('Deve buscar por número de brinco correspondente', () => {
    const result = filterAnimals(mockAnimals, { query: '102' });
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Estrela');
  });

  test('Deve buscar por parte do nome (case-insensitive)', () => {
    const result = filterAnimals(mockAnimals, { query: 'mimo' });
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Mimosa');
  });

  test('Deve filtrar fêmeas por status reprodutivo "prenhe"', () => {
    const result = filterAnimals(mockAnimals, { reproStatus: 'prenhe' });
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Estrela');
  });

  test('Filtros de status reprodutivo devem excluir machos automaticamente', () => {
    const vazias = filterAnimals(mockAnimals, { reproStatus: 'vazia' });
    expect(vazias.some((a) => a.sex === 'macho')).toBe(false);

    const prenhes = filterAnimals(mockAnimals, { reproStatus: 'prenhe' });
    expect(prenhes.some((a) => a.sex === 'macho')).toBe(false);

    // No filtro "todas", machos aparecem normalmente
    const todas = filterAnimals(mockAnimals, { reproStatus: 'todas' });
    expect(todas.some((a) => a.sex === 'macho')).toBe(true);
  });

  test('Deve incluir inativos quando showInactive for true ou quando houver busca direta por brinco histórico', () => {
    const comInativos = filterAnimals(mockAnimals, { showInactive: true });
    expect(comInativos.length).toBe(5);
    // Ativos primeiro, inativo por último
    expect(comInativos[4].id).toBe('5');
    expect(comInativos[4].exitStatus).toBe('vendido');

    const buscaHistorica = filterAnimals(mockAnimals, { query: '99' });
    expect(buscaHistorica.length).toBe(1);
    expect(buscaHistorica[0].name).toBe('Antiga');
  });
});
