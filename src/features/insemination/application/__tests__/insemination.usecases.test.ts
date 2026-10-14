import { TransactionRunner } from '@core/db/transaction';
import { AnimalRecord, AnimalRepository } from '@features/herd';
import { BullRecord, BullRepository } from '@features/bulls';
import {
  InseminationRecord,
  InseminationWithAnimalSummary,
} from '../../domain/insemination.entity';
import { InseminationRepository } from '../../domain/insemination.repository';
import {
  AlertCreator,
  OutboxEnqueuer,
  RegisterInseminationUseCase,
} from '../register-insemination.usecase';
import { AlertDeleter, DeleteInseminationUseCase } from '../delete-insemination.usecase';
import { ListRecentInseminationsUseCase } from '../list-recent-inseminations.usecase';

class InMemoryInseminationRepository implements InseminationRepository {
  public inseminations: InseminationRecord[] = [];

  async listRecentByFarm(
    farmId: string,
    limit: number = 20
  ): Promise<InseminationWithAnimalSummary[]> {
    return this.inseminations
      .filter((i) => i.farmId === farmId && !i.deletedAt)
      .slice(0, limit)
      .map((i) => ({
        ...i,
        animalEarTag: '101',
        animalName: 'Mimosa',
      }));
  }

  async listByAnimal(animalId: string): Promise<InseminationRecord[]> {
    return this.inseminations.filter(
      (i) => i.animalId === animalId && !i.deletedAt
    );
  }

  async findById(id: string): Promise<InseminationRecord | null> {
    return this.inseminations.find((i) => i.id === id && !i.deletedAt) ?? null;
  }

  async save(insemination: InseminationRecord): Promise<void> {
    this.inseminations.push(insemination);
  }

  async update(
    id: string,
    updates: Partial<InseminationRecord>
  ): Promise<InseminationRecord> {
    const idx = this.inseminations.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Not found');
    this.inseminations[idx] = { ...this.inseminations[idx], ...updates };
    return this.inseminations[idx];
  }

  async softDelete(id: string): Promise<void> {
    const item = await this.findById(id);
    if (item) {
      item.deletedAt = new Date().toISOString();
    }
  }
}

class InMemoryAnimalRepo implements AnimalRepository {
  public animals: AnimalRecord[] = [];

  async listByFarm(farmId: string): Promise<AnimalRecord[]> {
    return this.animals.filter((a) => a.farmId === farmId && !a.deletedAt);
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
    const idx = this.animals.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Not found');
    this.animals[idx] = { ...this.animals[idx], ...updates };
    return this.animals[idx];
  }
  async registerExit(): Promise<AnimalRecord> {
    throw new Error('Not implemented');
  }
  async reactivate(): Promise<AnimalRecord> {
    throw new Error('Not implemented');
  }
  async softDelete(): Promise<void> {}
}

class InMemoryBullRepo implements BullRepository {
  public bulls: BullRecord[] = [];

  async listByFarm(farmId: string): Promise<BullRecord[]> {
    return this.bulls.filter((b) => b.farmId === farmId && !b.deletedAt);
  }
  async findById(id: string): Promise<BullRecord | null> {
    return this.bulls.find((b) => b.id === id && !b.deletedAt) ?? null;
  }
  async save(bull: BullRecord): Promise<void> {
    this.bulls.push(bull);
  }
  async update(id: string, updates: Partial<BullRecord>): Promise<BullRecord> {
    const idx = this.bulls.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Not found');
    this.bulls[idx] = { ...this.bulls[idx], ...updates };
    return this.bulls[idx];
  }
  async adjustStraws(id: string, delta: number): Promise<BullRecord> {
    const bull = await this.findById(id);
    if (!bull) throw new Error('Not found');
    bull.strawsInStock = Math.max(0, bull.strawsInStock + delta);
    return bull;
  }
  async softDelete(): Promise<void> {}
}

class MockAlertService implements AlertCreator, AlertDeleter {
  public createdAlerts: any[] = [];
  public deletedSourceIds: string[] = [];

  async create(data: any): Promise<void> {
    this.createdAlerts.push(data);
  }
  async softDeleteBySourceId(sourceId: string): Promise<void> {
    this.deletedSourceIds.push(sourceId);
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

describe('Insemination Application Use Cases (In-Memory)', () => {
  let inseminationRepo: InMemoryInseminationRepository;
  let animalRepo: InMemoryAnimalRepo;
  let bullRepo: InMemoryBullRepo;
  let alertService: MockAlertService;
  let outbox: MockOutbox;

  let registerUseCase: RegisterInseminationUseCase;
  let listUseCase: ListRecentInseminationsUseCase;
  let deleteUseCase: DeleteInseminationUseCase;

  beforeEach(() => {
    inseminationRepo = new InMemoryInseminationRepository();
    animalRepo = new InMemoryAnimalRepo();
    bullRepo = new InMemoryBullRepo();
    alertService = new MockAlertService();
    outbox = new MockOutbox();

    registerUseCase = new RegisterInseminationUseCase(
      inseminationRepo,
      animalRepo,
      bullRepo,
      alertService,
      outbox,
      mockTx
    );

    listUseCase = new ListRecentInseminationsUseCase(inseminationRepo);

    deleteUseCase = new DeleteInseminationUseCase(
      inseminationRepo,
      animalRepo,
      bullRepo,
      alertService,
      outbox,
      mockTx
    );

    // Setup initial cow and bull
    animalRepo.animals.push({
      id: 'cow-1',
      farmId: 'farm-1',
      earTag: '101',
      earTagNormalized: '101',
      name: 'Mimosa',
      breed: 'Holandesa',
      sex: 'femea',
      birthDate: '2022-01-01',
      birthWeightKg: 40,
      lifeStage: 'adulta',
      reproStatus: 'vazia',
      exitStatus: 'ativo',
      exitDate: null,
      exitReason: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      deletedAt: null,
    });

    bullRepo.bulls.push({
      id: 'bull-1',
      farmId: 'farm-1',
      name: 'Jaguar TE',
      breed: 'Gir Leiteiro',
      code: 'GIR-100',
      strawsInStock: 5,
      notes: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      deletedAt: null,
    });
  });

  test('RegisterInseminationUseCase deve registrar IA, atualizar fêmea, debitar dose e criar alertas', async () => {
    const result = await registerUseCase.execute('farm-1', {
      animalId: 'cow-1',
      bullId: 'bull-1',
      bullName: 'Jaguar TE',
      date: '2026-10-14',
      inseminator: 'João Silva',
      notes: '1ª dose da manhã',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.expectedHeatDate).toBe('2026-11-04'); // +21d
      expect(result.value.pregnancyCheckDate).toBe('2026-11-28'); // +45d
      expect(result.value.result).toBe('pendente');
    }

    // 1. Status da vaca atualizado para inseminada
    const cow = await animalRepo.findById('cow-1');
    expect(cow?.reproStatus).toBe('inseminada');

    // 2. Estoque de doses do touro debitado de 5 para 4
    const bull = await bullRepo.findById('bull-1');
    expect(bull?.strawsInStock).toBe(4);

    // 3. Alertas de 21d e 45d criados
    expect(alertService.createdAlerts.length).toBe(2);
    expect(alertService.createdAlerts[0].type).toBe('heat_check_21d');
    expect(alertService.createdAlerts[1].type).toBe('pregnancy_check_45d');

    // 4. Mutações enfileiradas na outbox
    expect(outbox.queue.length).toBe(3); // inseminations INSERT, animals UPDATE, bulls UPDATE
    expect(outbox.queue[0].tableName).toBe('inseminations');
    expect(outbox.queue[1].tableName).toBe('animals');
    expect(outbox.queue[2].tableName).toBe('bulls');
  });

  test('RegisterInseminationUseCase deve bloquear se estoque do touro estiver zerado', async () => {
    bullRepo.bulls[0].strawsInStock = 0;

    const result = await registerUseCase.execute('farm-1', {
      animalId: 'cow-1',
      bullId: 'bull-1',
      bullName: 'Jaguar TE',
      date: '2026-10-14',
      inseminator: 'João Silva',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INSUFFICIENT_STRAWS');
    }

    expect(inseminationRepo.inseminations.length).toBe(0);
  });

  test('DeleteInseminationUseCase deve estornar dose, cancelar alertas e recalcular status da fêmea para vazia', async () => {
    // 1. Registra IA
    const registered = await registerUseCase.execute('farm-1', {
      animalId: 'cow-1',
      bullId: 'bull-1',
      bullName: 'Jaguar TE',
      date: '2026-10-14',
      inseminator: 'João Silva',
    });
    expect(registered.ok).toBe(true);
    const iaId = (registered as any).value.id;

    expect(bullRepo.bulls[0].strawsInStock).toBe(4);
    expect(animalRepo.animals[0].reproStatus).toBe('inseminada');

    // 2. Exclui a IA
    const deleteResult = await deleteUseCase.execute(iaId, { restoreStrawStock: true });
    expect(deleteResult.ok).toBe(true);

    // 3. IA marcada como soft deleted
    const ia = await inseminationRepo.findById(iaId);
    expect(ia).toBeNull();

    // 4. Dose estornada de 4 para 5
    expect(bullRepo.bulls[0].strawsInStock).toBe(5);

    // 5. Status da vaca revertido para vazia
    expect(animalRepo.animals[0].reproStatus).toBe('vazia');

    // 6. Alertas cancelados
    expect(alertService.deletedSourceIds).toContain(iaId);
  });

  test('ListRecentInseminationsUseCase deve retornar listagem formatada', async () => {
    await registerUseCase.execute('farm-1', {
      animalId: 'cow-1',
      bullId: 'bull-1',
      bullName: 'Jaguar TE',
      date: '2026-10-14',
      inseminator: 'João Silva',
    });

    const listResult = await listUseCase.execute('farm-1');
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value.length).toBe(1);
      expect(listResult.value[0].animalEarTag).toBe('101');
    }
  });
});
