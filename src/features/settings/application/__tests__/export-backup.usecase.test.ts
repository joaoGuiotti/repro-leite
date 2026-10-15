import { ExportWhatsAppBackupUseCase } from '../export-whatsapp-backup.usecase';
import { CopyBackupToClipboardUseCase } from '../copy-backup.usecase';
import { BackupRepository } from '../../domain/backup.repository';
import { FileShareService } from '../../domain/file-share.service';
import { BackupPayload } from '../../domain/backup.types';

describe('Backup Export Use Cases', () => {
  let mockBackupRepo: jest.Mocked<BackupRepository>;
  let mockShareService: jest.Mocked<FileShareService>;

  const samplePayload: BackupPayload = {
    metadata: {
      version: 1,
      app: 'repro-leite',
      farm_id: 'farm-1',
      exported_at: '2026-10-15T10:00:00.000Z',
    },
    summary: {
      animals_count: 5,
      inseminations_count: 2,
      bulls_count: 1,
      weighings_count: 4,
      settings_count: 4,
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
      exportBackup: jest.fn().mockResolvedValue(samplePayload),
      restoreBackup: jest.fn(),
      getHerdExportData: jest.fn(),
      getCalvesExportData: jest.fn(),
    };
    mockShareService = {
      shareFile: jest.fn().mockResolvedValue(true),
      pickJsonFile: jest.fn(),
      copyToClipboard: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('ExportWhatsAppBackupUseCase', () => {
    it('should compile backup payload to JSON and share file', async () => {
      const useCase = new ExportWhatsAppBackupUseCase(mockBackupRepo, mockShareService);
      const result = await useCase.execute({ farmId: 'farm-1' });

      expect(result.ok).toBe(true);
      expect(mockBackupRepo.exportBackup).toHaveBeenCalledWith('farm-1');
      expect(mockShareService.shareFile).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeType: 'application/json',
          filename: expect.stringMatching(/^backup_reproleite_.*\.json$/),
        })
      );
    });
  });

  describe('CopyBackupToClipboardUseCase', () => {
    it('should compile backup payload to compact JSON and copy to clipboard', async () => {
      const useCase = new CopyBackupToClipboardUseCase(mockBackupRepo, mockShareService);
      const result = await useCase.execute({ farmId: 'farm-1' });

      expect(result.ok).toBe(true);
      expect(mockBackupRepo.exportBackup).toHaveBeenCalledWith('farm-1');
      expect(mockShareService.copyToClipboard).toHaveBeenCalledWith(
        expect.stringContaining('"app":"repro-leite"')
      );
    });
  });
});
