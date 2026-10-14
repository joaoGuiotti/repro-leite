import { AlertRecord, AlertWithAnimalSummary, CreateAlertDTO } from '../../domain/alert.entity';
import { AlertRepository } from '../../domain/alert.repository';
import { CreateAlertUseCase, OutboxEnqueuer } from '../create-alert.usecase';
import { ListPendingAlertsUseCase } from '../list-pending-alerts.usecase';
import { CompleteAlertUseCase } from '../complete-alert.usecase';
import { DismissAlertsBySourceUseCase } from '../dismiss-alerts-by-source.usecase';
import { TransactionRunner } from '@core/db/transaction';

class InMemoryAlertRepository implements AlertRepository {
  private alerts: AlertRecord[] = [];

  async findById(id: string): Promise<AlertRecord | null> {
    const a = this.alerts.find((item) => item.id === id && !item.deletedAt);
    return a ? { ...a } : null;
  }

  async listPendingByFarm(
    farmId: string,
    upToDate?: string
  ): Promise<AlertWithAnimalSummary[]> {
    return this.alerts
      .filter((a) => {
        if (a.farmId !== farmId) return false;
        if (a.completedAt !== null) return false;
        if (a.deletedAt !== null) return false;
        if (upToDate && a.dueDate > upToDate) return false;
        return true;
      })
      .map((a) => ({
        ...a,
        animalEarTag: '101',
        animalName: 'Mimosa',
      }));
  }

  async save(alert: AlertRecord): Promise<void> {
    const idx = this.alerts.findIndex((a) => a.id === alert.id);
    if (idx >= 0) {
      this.alerts[idx] = { ...alert };
    } else {
      this.alerts.push({ ...alert });
    }
  }

  async complete(id: string): Promise<void> {
    const a = this.alerts.find((item) => item.id === id);
    if (a) {
      a.completedAt = new Date().toISOString();
      a.updatedAt = new Date().toISOString();
    }
  }

  async softDeleteBySourceId(sourceId: string): Promise<void> {
    const now = new Date().toISOString();
    for (const a of this.alerts) {
      if (a.sourceId === sourceId && !a.deletedAt) {
        a.deletedAt = now;
        a.updatedAt = now;
      }
    }
  }

  async softDelete(id: string): Promise<void> {
    const a = this.alerts.find((item) => item.id === id);
    if (a) {
      a.deletedAt = new Date().toISOString();
      a.updatedAt = new Date().toISOString();
    }
  }
}

class MockOutbox implements OutboxEnqueuer {
  public queue: {
    farmId: string;
    tableName: string;
    recordId: string;
    operation: string;
  }[] = [];

  async enqueue(
    farmId: string,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE'
  ): Promise<void> {
    this.queue.push({ farmId, tableName, recordId, operation });
  }
}

class SynchronousTransactionRunner implements TransactionRunner {
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return await fn();
  }
}

describe('Alert Use Cases', () => {
  let repo: InMemoryAlertRepository;
  let outbox: MockOutbox;
  let tx: SynchronousTransactionRunner;

  let createUseCase: CreateAlertUseCase;
  let listUseCase: ListPendingAlertsUseCase;
  let completeUseCase: CompleteAlertUseCase;
  let dismissUseCase: DismissAlertsBySourceUseCase;

  const farmId = 'farm-1';

  beforeEach(() => {
    repo = new InMemoryAlertRepository();
    outbox = new MockOutbox();
    tx = new SynchronousTransactionRunner();

    createUseCase = new CreateAlertUseCase(repo, outbox, tx);
    listUseCase = new ListPendingAlertsUseCase(repo);
    completeUseCase = new CompleteAlertUseCase(repo, outbox, tx);
    dismissUseCase = new DismissAlertsBySourceUseCase(repo, outbox, tx);
  });

  describe('CreateAlertUseCase', () => {
    it('deve criar um alerta e enfileirar na outbox com sucesso', async () => {
      const dto: CreateAlertDTO = {
        farmId,
        targetAnimalId: 'cow-1',
        type: 'heat_check_21d',
        dueDate: '2026-11-04',
        notes: 'Vigiar cio',
        sourceId: 'insem-1',
      };

      const result = await createUseCase.execute(dto);
      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.value.id).toBeDefined();
        expect(result.value.type).toBe('heat_check_21d');
        expect(result.value.dueDate).toBe('2026-11-04');
        expect(result.value.completedAt).toBeNull();

        expect(outbox.queue).toHaveLength(1);
        expect(outbox.queue[0]).toEqual({
          farmId,
          tableName: 'alerts',
          recordId: result.value.id,
          operation: 'INSERT',
        });
      }
    });

    it('deve retornar erro de validação se campos obrigatórios faltarem', async () => {
      const result = await createUseCase.execute({
        farmId: '',
        targetAnimalId: 'cow-1',
        type: 'heat_check_21d',
        dueDate: '2026-11-04',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('ListPendingAlertsUseCase', () => {
    it('deve listar alertas pendentes filtrando por data de corte', async () => {
      await createUseCase.execute({
        farmId,
        targetAnimalId: 'cow-1',
        type: 'heat_check_21d',
        dueDate: '2026-10-15',
      });

      await createUseCase.execute({
        farmId,
        targetAnimalId: 'cow-2',
        type: 'pregnancy_check_45d',
        dueDate: '2026-11-20',
      });

      // Busca até 2026-10-31: deve vir apenas o primeiro
      const res1 = await listUseCase.execute(farmId, '2026-10-31');
      expect(res1.ok).toBe(true);
      if (res1.ok) {
        expect(res1.value).toHaveLength(1);
        expect(res1.value[0].type).toBe('heat_check_21d');
        expect(res1.value[0].animalEarTag).toBe('101');
      }

      // Busca até 2026-12-01: devem vir ambos
      const res2 = await listUseCase.execute(farmId, '2026-12-01');
      expect(res2.ok).toBe(true);
      if (res2.ok) {
        expect(res2.value).toHaveLength(2);
      }
    });
  });

  describe('CompleteAlertUseCase', () => {
    it('deve marcar o alerta como concluído e emitir mutation outbox', async () => {
      const created = await createUseCase.execute({
        farmId,
        targetAnimalId: 'cow-1',
        type: 'heat_check_21d',
        dueDate: '2026-10-15',
      });

      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const completeResult = await completeUseCase.execute(created.value.id);
      expect(completeResult.ok).toBe(true);

      const listAfter = await listUseCase.execute(farmId);
      expect(listAfter.ok).toBe(true);
      if (listAfter.ok) {
        expect(listAfter.value).toHaveLength(0);
      }

      const updateOp = outbox.queue.find(
        (op) => op.recordId === created.value.id && op.operation === 'UPDATE'
      );
      expect(updateOp).toBeDefined();
    });

    it('deve retornar NOT_FOUND para alerta inexistente', async () => {
      const result = await completeUseCase.execute('nao-existe');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('DismissAlertsBySourceUseCase', () => {
    it('deve cancelar alertas atrelados à inseminação cancelada', async () => {
      await createUseCase.execute({
        farmId,
        targetAnimalId: 'cow-1',
        type: 'heat_check_21d',
        dueDate: '2026-10-15',
        sourceId: 'insem-999',
      });

      await createUseCase.execute({
        farmId,
        targetAnimalId: 'cow-1',
        type: 'pregnancy_check_45d',
        dueDate: '2026-11-15',
        sourceId: 'insem-999',
      });

      const dismissRes = await dismissUseCase.execute(farmId, 'insem-999');
      expect(dismissRes.ok).toBe(true);

      const listAfter = await listUseCase.execute(farmId);
      expect(listAfter.ok).toBe(true);
      if (listAfter.ok) {
        expect(listAfter.value).toHaveLength(0);
      }
    });
  });
});
