import { TransactionRunner } from '@core/db/transaction';
import { CalvesOutboxEnqueuer, CalvesRepository, CalfEnrichedRow } from '../../domain/calves.repository';
import { CreateCalfDTO, CreateWeighingDTO, WeighingRecord } from '../../domain/calves.types';
import { RecordWeighingUseCase } from '../record-weighing.usecase';

class InMemoryCalvesRepository implements CalvesRepository {
  public animals: Map<string, CalfEnrichedRow> = new Map();
  public weighings: Map<string, WeighingRecord> = new Map();

  async listCalvesByFarm(farmId: string): Promise<CalfEnrichedRow[]> {
    return Array.from(this.animals.values()).filter((a) => a.farmId === farmId);
  }

  async findCalfById(id: string): Promise<CalfEnrichedRow | null> {
    return this.animals.get(id) || null;
  }

  async findByEarTag(farmId: string, earTagNormalized: string): Promise<CalfEnrichedRow | null> {
    for (const a of this.animals.values()) {
      if (a.farmId === farmId && a.earTagNormalized === earTagNormalized) {
        return a;
      }
    }
    return null;
  }

  async saveCalf(calf: CreateCalfDTO): Promise<void> {
    this.animals.set(calf.id, {
      ...calf,
      lastWeightKg: calf.birthWeightKg,
      lastWeightDate: calf.birthDate,
    });
  }

  async updateCalf(id: string, updates: Partial<CreateCalfDTO>): Promise<void> {
    const existing = this.animals.get(id);
    if (existing) {
      this.animals.set(id, { ...existing, ...updates });
    }
  }

  async softDeleteCalf(id: string): Promise<void> {
    this.animals.delete(id);
  }

  async listWeighingsByAnimal(animalId: string): Promise<WeighingRecord[]> {
    return Array.from(this.weighings.values()).filter((w) => w.animalId === animalId);
  }

  async saveWeighing(weighing: CreateWeighingDTO): Promise<void> {
    this.weighings.set(weighing.id, {
      id: weighing.id,
      farmId: weighing.farmId,
      animalId: weighing.animalId,
      date: weighing.date,
      weightKg: weighing.weightKg,
      notes: weighing.notes,
      createdAt: weighing.createdAt,
    });
  }

  async softDeleteWeighing(id: string): Promise<void> {
    this.weighings.delete(id);
  }

  async getAvailableBulls(): Promise<any[]> {
    return [];
  }

  async getAvailableCows(): Promise<any[]> {
    return [];
  }
}

class FakeOutboxEnqueuer implements CalvesOutboxEnqueuer {
  public enqueued: {
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
    this.enqueued.push({ farmId, tableName, recordId, operation, payloadJson });
  }
}

const mockTx: TransactionRunner = {
  run: async (fn) => fn(),
};

describe('RecordWeighingUseCase', () => {
  let repo: InMemoryCalvesRepository;
  let outbox: FakeOutboxEnqueuer;
  let useCase: RecordWeighingUseCase;

  beforeEach(() => {
    repo = new InMemoryCalvesRepository();
    outbox = new FakeOutboxEnqueuer();
    useCase = new RecordWeighingUseCase(repo, outbox, mockTx);

    // Preenche um animal de teste
    repo.animals.set('calf-1', {
      id: 'calf-1',
      farmId: 'farm-1',
      earTag: '301',
      earTagNormalized: '301',
      breed: 'Girolando',
      sex: 'femea',
      birthDate: '2026-01-01',
      birthWeightKg: 40,
      lifeStage: 'bezerra',
      reproStatus: 'vazia',
      exitStatus: 'ativo',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:00:00.000Z',
    });
  });

  it('deve registrar pesagem válida com sucesso e enfileirar na outbox', async () => {
    const res = await useCase.execute({
      farmId: 'farm-1',
      animalId: 'calf-1',
      weightKg: 65.5,
      date: '2026-02-01',
      notes: 'Bezerra com bom ganho de peso',
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.weightKg).toBe(65.5);
    expect(res.value.date).toBe('2026-02-01');

    // Verifica persistência no repositório
    const weighings = await repo.listWeighingsByAnimal('calf-1');
    expect(weighings).toHaveLength(1);
    expect(weighings[0].weightKg).toBe(65.5);
    expect(weighings[0].notes).toBe('Bezerra com bom ganho de peso');

    // Verifica outbox
    expect(outbox.enqueued).toHaveLength(1);
    expect(outbox.enqueued[0].tableName).toBe('weighings');
    expect(outbox.enqueued[0].operation).toBe('INSERT');
    expect(outbox.enqueued[0].recordId).toBe(res.value.id);
  });

  it('deve rejeitar pesagem com peso inválido (menor ou igual a zero)', async () => {
    const res = await useCase.execute({
      farmId: 'farm-1',
      animalId: 'calf-1',
      weightKg: 0,
      date: '2026-02-01',
    });

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('INVALID_WEIGHT');
  });

  it('deve rejeitar data de pesagem anterior à data de nascimento', async () => {
    const res = await useCase.execute({
      farmId: 'farm-1',
      animalId: 'calf-1',
      weightKg: 35,
      date: '2025-12-15', // Antes de 2026-01-01
    });

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('INVALID_WEIGHING_DATE');
  });

  it('deve retornar erro se o animal não for encontrado', async () => {
    const res = await useCase.execute({
      farmId: 'farm-1',
      animalId: 'animal-inexistente',
      weightKg: 70,
      date: '2026-02-01',
    });

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('CALF_NOT_FOUND');
  });
});
