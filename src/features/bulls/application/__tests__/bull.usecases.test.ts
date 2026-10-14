import { TransactionRunner } from '@core/db/transaction';
import { BullRecord, CreateBullDTO } from '../../domain/bull.entity';
import { BullRepository } from '../../domain/bull.repository';
import { adjustBullStock } from '../../domain/bull-stock';
import { OutboxEnqueuer, RegisterBullUseCase } from '../register-bull.usecase';
import { AdjustBullStrawsUseCase } from '../adjust-bull-straws.usecase';
import { ListBullsUseCase } from '../list-bulls.usecase';

class InMemoryBullRepository implements BullRepository {
  public bulls: BullRecord[] = [];

  async listByFarm(farmId: string): Promise<BullRecord[]> {
    return this.bulls
      .filter((b) => b.farmId === farmId && !b.deletedAt)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<BullRecord | null> {
    return this.bulls.find((b) => b.id === id && !b.deletedAt) ?? null;
  }

  async save(bull: BullRecord): Promise<void> {
    this.bulls.push(bull);
  }

  async update(id: string, updates: Partial<BullRecord>): Promise<BullRecord> {
    const index = this.bulls.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('Not found');
    this.bulls[index] = { ...this.bulls[index], ...updates };
    return this.bulls[index];
  }

  async adjustStraws(id: string, delta: number): Promise<BullRecord> {
    const bull = await this.findById(id);
    if (!bull) throw new Error('Not found');
    const newStock = adjustBullStock(bull.strawsInStock, delta);
    bull.strawsInStock = newStock;
    bull.updatedAt = new Date().toISOString();
    return bull;
  }

  async softDelete(id: string): Promise<void> {
    const bull = await this.findById(id);
    if (bull) {
      bull.deletedAt = new Date().toISOString();
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

describe('Bulls Application Use Cases (In-Memory)', () => {
  let repo: InMemoryBullRepository;
  let outbox: MockOutbox;
  let registerUseCase: RegisterBullUseCase;
  let adjustUseCase: AdjustBullStrawsUseCase;
  let listUseCase: ListBullsUseCase;

  beforeEach(() => {
    repo = new InMemoryBullRepository();
    outbox = new MockOutbox();
    registerUseCase = new RegisterBullUseCase(repo, outbox, mockTx);
    adjustUseCase = new AdjustBullStrawsUseCase(repo, outbox, mockTx);
    listUseCase = new ListBullsUseCase(repo);
  });

  test('RegisterBullUseCase deve cadastrar touro e enfileirar INSERT na outbox', async () => {
    const input: CreateBullDTO = {
      farmId: 'farm-1',
      name: 'Jaguar TE',
      breed: 'Gir Leiteiro',
      code: 'GIR-100',
      strawsInStock: 25,
      notes: 'Linhagem de alto rendimento',
    };

    const result = await registerUseCase.execute(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Jaguar TE');
      expect(result.value.breed).toBe('Gir Leiteiro');
      expect(result.value.strawsInStock).toBe(25);
      expect(result.value.id).toBeDefined();
    }

    expect(repo.bulls.length).toBe(1);
    expect(outbox.queue.length).toBe(1);
    expect(outbox.queue[0].operation).toBe('INSERT');
    expect(outbox.queue[0].tableName).toBe('bulls');
  });

  test('RegisterBullUseCase deve rejeitar touro sem nome ou sem raça', async () => {
    const semNome = await registerUseCase.execute({
      farmId: 'farm-1',
      name: '',
      breed: 'Holandesa',
    });
    expect(semNome.ok).toBe(false);
    if (!semNome.ok) {
      expect(semNome.error.code).toBe('INVALID_NAME');
    }

    const semRaca = await registerUseCase.execute({
      farmId: 'farm-1',
      name: 'Faraó',
      breed: '   ',
    });
    expect(semRaca.ok).toBe(false);
    if (!semRaca.ok) {
      expect(semRaca.error.code).toBe('INVALID_BREED');
    }

    expect(repo.bulls.length).toBe(0);
  });

  test('AdjustBullStrawsUseCase deve ajustar doses e enfileirar UPDATE na outbox', async () => {
    const registered = await registerUseCase.execute({
      farmId: 'farm-1',
      name: 'Modelo',
      breed: 'Girolando',
      strawsInStock: 10,
    });
    expect(registered.ok).toBe(true);
    const bullId = (registered as any).value.id;

    // Incrementa +5
    const incResult = await adjustUseCase.execute({ bullId, delta: 5 });
    expect(incResult.ok).toBe(true);
    if (incResult.ok) {
      expect(incResult.value.strawsInStock).toBe(15);
    }

    // Decrementa -3
    const decResult = await adjustUseCase.execute({ bullId, delta: -3 });
    expect(decResult.ok).toBe(true);
    if (decResult.ok) {
      expect(decResult.value.strawsInStock).toBe(12);
    }

    const lastOutbox = outbox.queue[outbox.queue.length - 1];
    expect(lastOutbox.operation).toBe('UPDATE');
    expect(lastOutbox.recordId).toBe(bullId);
  });

  test('AdjustBullStrawsUseCase deve bloquear ajuste que resulte em estoque negativo', async () => {
    const registered = await registerUseCase.execute({
      farmId: 'farm-1',
      name: 'Radar',
      breed: 'Gir',
      strawsInStock: 2,
    });
    const bullId = (registered as any).value.id;

    const result = await adjustUseCase.execute({ bullId, delta: -5 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STOCK_ADJUSTMENT');
    }

    const bull = await repo.findById(bullId);
    expect(bull?.strawsInStock).toBe(2);
  });

  test('AdjustBullStrawsUseCase.softDelete deve marcar deletedAt e enfileirar DELETE', async () => {
    const registered = await registerUseCase.execute({
      farmId: 'farm-1',
      name: 'Touro Descartado',
      breed: 'Jersey',
    });
    const bullId = (registered as any).value.id;

    const delResult = await adjustUseCase.softDelete(bullId);
    expect(delResult.ok).toBe(true);

    const deleted = await repo.findById(bullId);
    expect(deleted).toBeNull();

    const lastOutbox = outbox.queue[outbox.queue.length - 1];
    expect(lastOutbox.operation).toBe('DELETE');
    expect(lastOutbox.recordId).toBe(bullId);
  });

  test('ListBullsUseCase deve listar touros ativos da fazenda ordenados por nome', async () => {
    await registerUseCase.execute({ farmId: 'farm-1', name: 'Zorro', breed: 'Gir' });
    await registerUseCase.execute({ farmId: 'farm-1', name: 'Apollo', breed: 'Holandesa' });
    await registerUseCase.execute({ farmId: 'farm-2', name: 'Outra Fazenda', breed: 'Jersey' });

    const listResult = await listUseCase.execute('farm-1');
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value.length).toBe(2);
      expect(listResult.value[0].name).toBe('Apollo');
      expect(listResult.value[1].name).toBe('Zorro');
    }
  });
});
