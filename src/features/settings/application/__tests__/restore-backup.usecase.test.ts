import { RestoreBackupUseCase } from '../restore-backup.usecase';
import { BackupRepository } from '../../domain/backup.repository';
import { ok, err } from '@/core/result';

describe('RestoreBackupUseCase', () => {
  let mockBackupRepo: jest.Mocked<BackupRepository>;

  const validPayload = {
    metadata: {
      version: 1,
      app: 'repro-leite',
      farm_id: 'farm-1',
      exported_at: '2026-10-15T10:00:00.000Z',
    },
    summary: {
      animals_count: 1,
      inseminations_count: 0,
      bulls_count: 0,
      weighings_count: 0,
      settings_count: 0,
    },
    data: {
      settings: [],
      bulls: [],
      animals: [],
      inseminations: [],
      weighings: [],
      alerts: [],
    },
  };

  beforeEach(() => {
    mockBackupRepo = {
      exportBackup: jest.fn(),
      restoreBackup: jest.fn().mockResolvedValue(ok(undefined)),
      getHerdExportData: jest.fn(),
      getCalvesExportData: jest.fn(),
    };
  });

  it('should validate and restore valid backup payload', async () => {
    const useCase = new RestoreBackupUseCase(mockBackupRepo);
    const result = await useCase.execute({
      jsonContent: JSON.stringify(validPayload),
      targetFarmId: 'farm-1',
    });

    expect(result.ok).toBe(true);
    expect(mockBackupRepo.restoreBackup).toHaveBeenCalled();
  });

  it('should reject invalid or corrupt JSON string', async () => {
    const useCase = new RestoreBackupUseCase(mockBackupRepo);
    const result = await useCase.execute({
      jsonContent: '{ invalid json',
      targetFarmId: 'farm-1',
    });

    expect(result.ok).toBe(false);
    expect(mockBackupRepo.restoreBackup).not.toHaveBeenCalled();
  });

  it('should propagate repository errors when atomic restoration fails', async () => {
    mockBackupRepo.restoreBackup.mockResolvedValue(err(new Error('DB lock error')));

    const useCase = new RestoreBackupUseCase(mockBackupRepo);
    const result = await useCase.execute({
      jsonContent: JSON.stringify(validPayload),
      targetFarmId: 'farm-1',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('DB lock error');
    }
  });
});
