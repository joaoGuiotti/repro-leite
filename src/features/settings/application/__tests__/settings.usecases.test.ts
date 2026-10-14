import { DEFAULT_FARM_PARAMETERS } from '../../domain/setting.entity';
import { SettingRepository } from '../../domain/setting.repository';
import { GetSettingsUseCase } from '../get-settings.usecase';
import { OutboxEnqueuer, UpdateSettingUseCase } from '../update-setting.usecase';
import { TransactionRunner } from '@core/db/transaction';

class InMemorySettingRepository implements SettingRepository {
  private store: Map<string, string> = new Map();

  async get(farmId: string, key: string): Promise<string | null> {
    return this.store.get(`${farmId}:${key}`) ?? null;
  }

  async getAll(farmId: string): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const [k, v] of this.store.entries()) {
      if (k.startsWith(`${farmId}:`)) {
        const settingKey = k.replace(`${farmId}:`, '');
        result[settingKey] = v;
      }
    }
    return result;
  }

  async set(farmId: string, key: string, value: string): Promise<void> {
    this.store.set(`${farmId}:${key}`, value);
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

describe('Settings Use Cases', () => {
  let repo: InMemorySettingRepository;
  let outbox: MockOutbox;
  let tx: SynchronousTransactionRunner;

  let getUseCase: GetSettingsUseCase;
  let updateUseCase: UpdateSettingUseCase;

  const farmId = 'farm-123';

  beforeEach(() => {
    repo = new InMemorySettingRepository();
    outbox = new MockOutbox();
    tx = new SynchronousTransactionRunner();

    getUseCase = new GetSettingsUseCase(repo);
    updateUseCase = new UpdateSettingUseCase(repo, outbox, tx);
  });

  describe('GetSettingsUseCase', () => {
    it('deve retornar parâmetros padrão quando não houver configurações salvas', async () => {
      const result = await getUseCase.execute(farmId);
      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.value).toEqual(DEFAULT_FARM_PARAMETERS);
      }
    });

    it('deve carregar parâmetros customizados salvos', async () => {
      await repo.set(farmId, 'heat_window_days', '22');
      await repo.set(farmId, 'pregnancy_check_days', '50');

      const result = await getUseCase.execute(farmId);
      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.value.heatWindowDays).toBe(22);
        expect(result.value.pregnancyCheckDays).toBe(50);
        expect(result.value.gestationDays).toBe(DEFAULT_FARM_PARAMETERS.gestationDays);
      }
    });

    it('deve falhar se farmId não for informado', async () => {
      const result = await getUseCase.execute('');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('UpdateSettingUseCase', () => {
    it('deve atualizar configuração e enfileirar mutação na outbox', async () => {
      const result = await updateUseCase.execute(farmId, 'heat_window_days', '24');
      expect(result.ok).toBe(true);

      const saved = await repo.get(farmId, 'heat_window_days');
      expect(saved).toBe('24');

      expect(outbox.queue).toHaveLength(1);
      expect(outbox.queue[0]).toEqual({
        farmId,
        tableName: 'settings',
        recordId: `${farmId}_heat_window_days`,
        operation: 'UPDATE',
      });
    });

    it('deve falhar com chave vazia', async () => {
      const result = await updateUseCase.execute(farmId, '   ', '24');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });
});
