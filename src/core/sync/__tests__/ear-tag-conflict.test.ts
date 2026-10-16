import { ConflictResolver } from '../conflict-resolver';

describe('Ear Tag Conflict Detection (User Story 5)', () => {
  it('deve detectar conflito quando outro animal ativo possui o mesmo brinco', () => {
    const existingAnimals = [
      { id: 'anim-1', earTag: '101' },
      { id: 'anim-2', earTag: '102' },
    ];

    const hasConflict = ConflictResolver.checkEarTagConflict('101', 'anim-new-remote', existingAnimals);
    expect(hasConflict).toBe(true);
  });

  it('não deve apontar conflito para o mesmo animal atualizando seus próprios dados', () => {
    const existingAnimals = [
      { id: 'anim-1', earTag: '101' },
      { id: 'anim-2', earTag: '102' },
    ];

    const hasConflict = ConflictResolver.checkEarTagConflict('101', 'anim-1', existingAnimals);
    expect(hasConflict).toBe(false);
  });

  it('não deve apontar conflito quando o brinco for único', () => {
    const existingAnimals = [
      { id: 'anim-1', earTag: '101' },
      { id: 'anim-2', earTag: '102' },
    ];

    const hasConflict = ConflictResolver.checkEarTagConflict('103', 'anim-3', existingAnimals);
    expect(hasConflict).toBe(false);
  });

  it('deve ser insensível a maiúsculas e espaços em branco', () => {
    const existingAnimals = [
      { id: 'anim-1', earTag: 'brinco-01' },
    ];

    const hasConflict = ConflictResolver.checkEarTagConflict('  BRINCO-01  ', 'anim-2', existingAnimals);
    expect(hasConflict).toBe(true);
  });
});
