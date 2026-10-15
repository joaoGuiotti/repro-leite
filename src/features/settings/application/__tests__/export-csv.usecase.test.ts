import { ExportHerdCsvUseCase } from '../export-herd-csv.usecase';
import { ExportCalvesCsvUseCase } from '../export-calves-csv.usecase';
import { BackupRepository } from '../../domain/backup.repository';
import { FileShareService } from '../../domain/file-share.service';

describe('Export CSV Use Cases', () => {
  let mockBackupRepo: jest.Mocked<BackupRepository>;
  let mockShareService: jest.Mocked<FileShareService>;

  beforeEach(() => {
    mockBackupRepo = {
      exportBackup: jest.fn(),
      restoreBackup: jest.fn(),
      getHerdExportData: jest.fn(),
      getCalvesExportData: jest.fn(),
    };
    mockShareService = {
      shareFile: jest.fn().mockResolvedValue(true),
      pickJsonFile: jest.fn(),
      copyToClipboard: jest.fn(),
    };
  });

  describe('ExportHerdCsvUseCase', () => {
    it('should extract herd rows, format CSV and share file', async () => {
      mockBackupRepo.getHerdExportData.mockResolvedValue([
        {
          ear_tag: '101',
          name: 'Estrela',
          category: 'Vaca',
          reproductive_status: 'Prenhe',
          days_in_milk_or_open: '120',
          last_insemination_date: '01/01/2026',
          bull_name: 'Jaguar',
          expected_heat_date: '-',
          pregnancy_check_date: '15/02/2026',
          dry_off_date: '10/08/2026',
          expected_calving_date: '10/10/2026',
          notes: 'Observação',
        },
      ]);

      const useCase = new ExportHerdCsvUseCase(mockBackupRepo, mockShareService);
      const result = await useCase.execute({ farmId: 'farm-1' });

      expect(result.ok).toBe(true);
      expect(mockBackupRepo.getHerdExportData).toHaveBeenCalledWith('farm-1');
      expect(mockShareService.shareFile).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeType: 'text/csv',
          filename: expect.stringMatching(/^rebanho_export_.*\.csv$/),
        })
      );
    });
  });

  describe('ExportCalvesCsvUseCase', () => {
    it('should extract calves rows, format CSV and share file', async () => {
      mockBackupRepo.getCalvesExportData.mockResolvedValue([
        {
          ear_tag: '301',
          name: 'Princesa',
          sex: 'Fêmea',
          birth_date: '10/05/2026',
          birth_weight_kg: '41,0 kg',
          mother_ear_tag: '101',
          father_name: 'Jaguar',
          maternal_grandmother_name: 'Boneca',
          feeding_stage: 'Pico',
          daily_milk_liters: '8,0 L',
          last_weight_kg: '95,0 kg',
          last_weighing_date: '10/08/2026',
          average_daily_gain_g: '850 g/dia',
          breeding_target_weight_kg: '360,0 kg',
          breeding_readiness_status: 'Em Recria',
        },
      ]);

      const useCase = new ExportCalvesCsvUseCase(mockBackupRepo, mockShareService);
      const result = await useCase.execute({ farmId: 'farm-1' });

      expect(result.ok).toBe(true);
      expect(mockBackupRepo.getCalvesExportData).toHaveBeenCalledWith('farm-1');
      expect(mockShareService.shareFile).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeType: 'text/csv',
          filename: expect.stringMatching(/^bezerras_export_.*\.csv$/),
        })
      );
    });
  });
});
