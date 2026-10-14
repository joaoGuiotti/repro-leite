import { TransactionRunner } from '@core/db/transaction';
import { AnimalRecord, CreateAnimalDTO, RegisterExitDTO } from '../../domain/animal.entity';
import { AnimalRepository } from '../../domain/animal.repository';
import { OutboxEnqueuer, RegisterAnimalUseCase } from '../register-animal.usecase';
import { RemoveAnimalUseCase } from '../remove-animal.usecase';
import { ListAnimalsUseCase } from '../list-animals.usecase';

class InMemoryAnimalRepository implements AnimalRepository {
  public animals: AnimalRecord[] = [];

  async listByFarm(farmId: string, includeInactive: boolean = true): Promise<AnimalRecord[]> {
    return this.animals.filter((a) => {
      if (a.farmId !== farmId || a.deletedAt) return false;
      if (!includeInactive && a.exitStatus !== 'ativo') return false;
      return true;
    });
  }

  async findById(id: string): Promise<AnimalRecord | null> {
    return this.animals.find((a) => a.id === id && !a.deletedAt) ?? null;
  }

  async findByEarTag(
    farmId: string,
    earTagNormalized: string,
    onlyActive: boolean = false
  ): Promise<AnimalRecord | null> {
    return (
      this.animals.find((a) => {
        if (a.farmId !== farmId || a.deletedAt) return false;
        if (a.earTagNormalized !== earTagNormalized) return false;
        if (onlyActive && a.exitStatus !== 'ativo') return false;
        return true;
      }) ?? null
    );
  }

  async save(animal: AnimalRecord): Promise<void> {
    this.animals.push(animal);
  }

  async update(id: string, updates: Partial<AnimalRecord>): Promise<AnimalRecord> {
    const index = this.animals.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Not found');
    this.animals[index] = { ...this.animals[index], ...updates };
    return this.animals[index];
  }

  async registerExit(data: RegisterExitDTO): Promise<AnimalRecord> {
    const animal = await this.findById(data.animalId);
    if (!animal) throw new Error('Not found');
    animal.exitStatus = data.exitStatus;
    animal.exitDate = data.exitDate;
    animal.exitReason = data.exitReason ?? null;
    animal.updatedAt = new Date().toISOString();
    return animal;
  }

  async reactivate(animalId: string): Promise<AnimalRecord> {
    const animal = await this.findById(animalId);
    if (!animal) throw new Error('Not found');
    animal.exitStatus = 'ativo';
    animal.exitDate = null;
    animal.exitReason = null;
    return animal;
  }

  async softDelete(id: string): Promise<void> {
    const animal = await this.findById(id);
    if (animal) {
      animal.deletedAt = new Date().toISOString();
    }
  }
}

class MockOutbox implements OutboxEnqueuer {
  public queue: {
    farmId: string;
    tableName: string;
    recordId: string;
    operation: string;
    payloadJson?: Record<string, unknown> | null;
  }[] = [];

  async enqueue(
    farmId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payloadJson?: Record<string, unknown> | null
  ): Promise<void> {
    this.queue.push({ farmId, tableName, recordId, operation, payloadJson });
  }
}

const mockTx: TransactionRunner = {
  run: async <T>(fn: () => Promise<T>): Promise<T> => fn(),
};

describe('Herd Application Use Cases (In-Memory)', () => {
  let repo: InMemoryAnimalRepository;
  let outbox: MockOutbox;
  let registerUseCase: RegisterAnimalUseCase;
  let removeUseCase: RemoveAnimalUseCase;
  let listUseCase: ListAnimalsUseCase;

  beforeEach(() => {
    repo = new InMemoryAnimalRepository();
    outbox = new MockOutbox();
    registerUseCase = new RegisterAnimalUseCase(repo, outbox, mockTx);
    removeUseCase = new RemoveAnimalUseCase(repo, outbox, mockTx);
    listUseCase = new ListAnimalsUseCase(repo);
  });

  test('RegisterAnimalUseCase deve cadastrar animal ativo e enfileirar na outbox com transação', async () => {
    const input: CreateAnimalDTO = {
      farmId: 'farm-1',
      earTag: 'BR-101',
      breed: 'Holandesa',
      sex: 'femea',
      birthDate: '2023-01-01',
      reproStatus: 'vazia',
    };

    const result = await registerUseCase.execute(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.earTag).toBe('BR-101');
      expect(result.value.earTagNormalized).toBe('BR101');
      expect(result.value.exitStatus).toBe('ativo');
      expect(result.value.reproStatus).toBe('vazia');
    }

    expect(repo.animals.length).toBe(1);
    expect(outbox.queue.length).toBe(1);
    expect(outbox.queue[0].operation).toBe('INSERT');
    expect(outbox.queue[0].tableName).toBe('animals');
  });

  test('RegisterAnimalUseCase deve forçar reproStatus "nao_se_aplica" para machos', async () => {
    const input: CreateAnimalDTO = {
      farmId: 'farm-1',
      earTag: 'M-01',
      breed: 'Gir',
      sex: 'macho',
      birthDate: '2024-01-01',
      reproStatus: 'vazia', // Mesmo se enviado, macho deve ser forçado a nao_se_aplica
    };

    const result = await registerUseCase.execute(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sex).toBe('macho');
      expect(result.value.reproStatus).toBe('nao_se_aplica');
    }
  });

  test('RegisterAnimalUseCase deve bloquear cadastro de brinco em uso por animal ativo', async () => {
    await registerUseCase.execute({
      farmId: 'farm-1',
      earTag: '102',
      breed: 'Girolando',
      sex: 'femea',
      birthDate: '2022-01-01',
    });

    const duplicateResult = await registerUseCase.execute({
      farmId: 'farm-1',
      earTag: ' 102 ',
      breed: 'Jersey',
      sex: 'femea',
      birthDate: '2023-05-01',
    });

    expect(duplicateResult.ok).toBe(false);
    if (!duplicateResult.ok) {
      expect(duplicateResult.error.code).toBe('EAR_TAG_ALREADY_IN_USE');
    }
    expect(repo.animals.length).toBe(1);
  });

  test('RemoveAnimalUseCase.registerExit deve registrar saída e enfileirar UPDATE', async () => {
    const registered = await registerUseCase.execute({
      farmId: 'farm-1',
      earTag: '103',
      breed: 'Holandesa',
      sex: 'femea',
      birthDate: '2021-01-01',
    });
    expect(registered.ok).toBe(true);
    const animalId = (registered as any).value.id;

    const exitResult = await removeUseCase.registerExit({
      animalId,
      exitStatus: 'vendido',
      exitDate: '2026-10-14',
      exitReason: 'Venda de descarte produtivo',
    });

    expect(exitResult.ok).toBe(true);
    if (exitResult.ok) {
      expect(exitResult.value.exitStatus).toBe('vendido');
      expect(exitResult.value.exitDate).toBe('2026-10-14');
    }

    const lastOutbox = outbox.queue[outbox.queue.length - 1];
    expect(lastOutbox.operation).toBe('UPDATE');
    expect(lastOutbox.recordId).toBe(animalId);
  });

  test('RemoveAnimalUseCase.softDelete deve marcar deletedAt e enfileirar DELETE', async () => {
    const registered = await registerUseCase.execute({
      farmId: 'farm-1',
      earTag: '104',
      breed: 'Holandesa',
      sex: 'femea',
      birthDate: '2021-01-01',
    });
    const animalId = (registered as any).value.id;

    const deleteResult = await removeUseCase.softDelete(animalId);
    expect(deleteResult.ok).toBe(true);

    const deleted = await repo.findById(animalId);
    expect(deleted).toBeNull();

    const lastOutbox = outbox.queue[outbox.queue.length - 1];
    expect(lastOutbox.operation).toBe('DELETE');
    expect(lastOutbox.recordId).toBe(animalId);
  });

  test('RemoveAnimalUseCase.reactivate deve reativar animal e enfileirar UPDATE', async () => {
    const registered = await registerUseCase.execute({
      farmId: 'farm-1',
      earTag: '105',
      breed: 'Holandesa',
      sex: 'femea',
      birthDate: '2021-01-01',
    });
    const animalId = (registered as any).value.id;

    await removeUseCase.registerExit({
      animalId,
      exitStatus: 'vendido',
      exitDate: '2026-10-14',
    });

    const reactivated = await removeUseCase.reactivate(animalId);
    expect(reactivated.ok).toBe(true);
    if (reactivated.ok) {
      expect(reactivated.value.exitStatus).toBe('ativo');
      expect(reactivated.value.exitDate).toBeNull();
      expect(reactivated.value.exitReason).toBeNull();
    }

    const lastOutbox = outbox.queue[outbox.queue.length - 1];
    expect(lastOutbox.operation).toBe('UPDATE');
    expect(lastOutbox.recordId).toBe(animalId);
  });

  test('RemoveAnimalUseCase.reactivate deve rejeitar reativação se brinco estiver em uso por outro ativo', async () => {
    // 1. Cadastra animal 106 e registra saída
    const registered1 = await registerUseCase.execute({
      farmId: 'farm-1',
      earTag: '106',
      breed: 'Holandesa',
      sex: 'femea',
      birthDate: '2021-01-01',
    });
    const animal1Id = (registered1 as any).value.id;

    await removeUseCase.registerExit({
      animalId: animal1Id,
      exitStatus: 'vendido',
      exitDate: '2026-10-14',
    });

    // 2. Novo animal ativo é cadastrado com mesmo brinco 106
    await registerUseCase.execute({
      farmId: 'farm-1',
      earTag: '106',
      breed: 'Jersey',
      sex: 'femea',
      birthDate: '2023-01-01',
    });

    // 3. Tentar reativar o animal antigo deve falhar com EAR_TAG_CONFLICT
    const reactivateResult = await removeUseCase.reactivate(animal1Id);
    expect(reactivateResult.ok).toBe(false);
    if (!reactivateResult.ok) {
      expect(reactivateResult.error.code).toBe('EAR_TAG_CONFLICT');
    }
  });

  test('ListAnimalsUseCase deve listar e filtrar animais da fazenda', async () => {
    await registerUseCase.execute({
      farmId: 'farm-1',
      earTag: '101',
      name: 'Mimosa',
      breed: 'Holandesa',
      sex: 'femea',
      birthDate: '2020-01-01',
      reproStatus: 'vazia',
    });
    await registerUseCase.execute({
      farmId: 'farm-1',
      earTag: '102',
      name: 'Estrela',
      breed: 'Jersey',
      sex: 'femea',
      birthDate: '2021-01-01',
      reproStatus: 'prenhe',
    });

    const all = await listUseCase.execute('farm-1');
    expect(all.ok).toBe(true);
    if (all.ok) {
      expect(all.value.length).toBe(2);
    }

    const vazias = await listUseCase.execute('farm-1', { reproStatus: 'vazia' });
    expect(vazias.ok).toBe(true);
    if (vazias.ok) {
      expect(vazias.value.length).toBe(1);
      expect(vazias.value[0].earTag).toBe('101');
    }

    const busca = await listUseCase.execute('farm-1', { query: 'Estrela' });
    expect(busca.ok).toBe(true);
    if (busca.ok) {
      expect(busca.value.length).toBe(1);
      expect(busca.value[0].earTag).toBe('102');
    }
  });
});
