import { ConflictResolver } from '../conflict-resolver';

describe('Sync: ConflictResolver', () => {
  test('deve aplicar registro remoto quando não existe registro local correspondente', () => {
    const remote = {
      id: 'animal-1',
      ear_tag: '101',
      name: 'Mimosa',
      updated_at: '2026-10-14T10:00:00.000Z',
    };

    const result = ConflictResolver.resolve('animals', null, remote);
    expect(result.action).toBe('apply_remote');
    expect(result.resolvedRecord).toEqual(remote);
  });

  test('farms: Server-Wins absoluto mesmo que local tenha timestamp posterior', () => {
    const local = {
      id: 'farm-1',
      name: 'Nome Local Alterado',
      updated_at: '2026-10-14T12:00:00.000Z',
    };
    const remote = {
      id: 'farm-1',
      name: 'Nome Servidor Oficial',
      updated_at: '2026-10-14T10:00:00.000Z',
    };

    const result = ConflictResolver.resolve('farms', local, remote);
    expect(result.action).toBe('apply_remote');
    expect(result.resolvedRecord.name).toBe('Nome Servidor Oficial');
  });

  test('animals: LWW aplica remoto quando remote.updated_at > local.updated_at', () => {
    const local = {
      id: 'animal-1',
      name: 'Nome Antigo',
      updated_at: '2026-10-14T09:00:00.000Z',
    };
    const remote = {
      id: 'animal-1',
      name: 'Nome Mais Recente na Nuvem',
      updated_at: '2026-10-14T10:30:00.000Z',
    };

    const result = ConflictResolver.resolve('animals', local, remote);
    expect(result.action).toBe('apply_remote');
    expect(result.resolvedRecord.name).toBe('Nome Mais Recente na Nuvem');
  });

  test('animals: LWW mantém local quando local.updated_at >= remote.updated_at', () => {
    const local = {
      id: 'animal-1',
      name: 'Nome Mais Recente no Curral',
      updated_at: '2026-10-14T11:00:00.000Z',
    };
    const remote = {
      id: 'animal-1',
      name: 'Nome Desatualizado Remoto',
      updated_at: '2026-10-14T10:00:00.000Z',
    };

    const result = ConflictResolver.resolve('animals', local, remote);
    expect(result.action).toBe('keep_local');
    expect(result.resolvedRecord.name).toBe('Nome Mais Recente no Curral');
  });

  test('alerts: prioriza status de conclusão se local foi concluído', () => {
    const local = {
      id: 'alert-1',
      type: 'toque_confirmacao',
      completed_at: '2026-10-14T08:00:00.000Z',
      updated_at: '2026-10-14T08:00:00.000Z',
    };
    const remote = {
      id: 'alert-1',
      type: 'toque_confirmacao',
      completed_at: null,
      updated_at: '2026-10-14T10:00:00.000Z',
    };

    const result = ConflictResolver.resolve('alerts', local, remote);
    expect(result.action).toBe('merge');
    expect(result.resolvedRecord.completed_at).toBe('2026-10-14T08:00:00.000Z');
  });

  test('alerts: prioriza status de conclusão se remoto foi concluído', () => {
    const local = {
      id: 'alert-1',
      type: 'secagem',
      completed_at: null,
      updated_at: '2026-10-14T11:00:00.000Z',
    };
    const remote = {
      id: 'alert-1',
      type: 'secagem',
      completed_at: '2026-10-14T09:30:00.000Z',
      updated_at: '2026-10-14T09:30:00.000Z',
    };

    const result = ConflictResolver.resolve('alerts', local, remote);
    expect(result.action).toBe('merge');
    expect(result.resolvedRecord.completed_at).toBe('2026-10-14T09:30:00.000Z');
  });

  test('bulls: preserva contagem local de doses de sêmen em merge', () => {
    const local = {
      id: 'bull-1',
      name: 'Touro Radar',
      straws_in_stock: 7, // 3 doses gastas no curral
      updated_at: '2026-10-14T08:00:00.000Z',
    };
    const remote = {
      id: 'bull-1',
      name: 'Touro Radar Importado', // Nome cadastral atualizado na nuvem
      straws_in_stock: 10,
      updated_at: '2026-10-14T10:00:00.000Z',
    };

    const result = ConflictResolver.resolve('bulls', local, remote);
    expect(result.action).toBe('merge');
    expect(result.resolvedRecord.name).toBe('Touro Radar Importado');
    expect(result.resolvedRecord.straws_in_stock).toBe(7);
  });
});
