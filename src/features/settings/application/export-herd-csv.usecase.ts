import { Result, ok, err } from '@/core/result';
import { BackupRepository } from '../domain/backup.repository';
import { FileShareService } from '../domain/file-share.service';
import { formatCsvContent } from '../domain/engines/format-csv';

export interface ExportHerdCsvInput {
  farmId: string;
}

export class ExportHerdCsvUseCase {
  constructor(
    private backupRepo: BackupRepository,
    private shareService: FileShareService
  ) {}

  async execute(input: ExportHerdCsvInput): Promise<Result<boolean, Error>> {
    try {
      const data = await this.backupRepo.getHerdExportData(input.farmId);

      const columns = [
        { key: 'ear_tag', label: 'BRINCO' },
        { key: 'name', label: 'NOME' },
        { key: 'category', label: 'CATEGORIA' },
        { key: 'reproductive_status', label: 'STATUS_REPRODUTIVO' },
        { key: 'days_in_milk_or_open', label: 'DIAS_EM_ABERTO' },
        { key: 'last_insemination_date', label: 'DATA_ULTIMA_IA' },
        { key: 'bull_name', label: 'TOURO_IA' },
        { key: 'expected_heat_date', label: 'DATA_PREVISTA_CIO' },
        { key: 'pregnancy_check_date', label: 'DATA_PREVISTA_TOQUE' },
        { key: 'dry_off_date', label: 'DATA_PREVISTA_SECAGEM' },
        { key: 'expected_calving_date', label: 'DATA_PREVISTA_PARTO' },
        { key: 'notes', label: 'OBSERVAÇÕES' },
      ];

      const csvString = formatCsvContent(data, columns);
      const dateSuffix = new Date().toISOString().slice(0, 10);
      const filename = `rebanho_export_${dateSuffix}.csv`;

      const shared = await this.shareService.shareFile({
        filename,
        content: csvString,
        mimeType: 'text/csv',
        dialogTitle: 'Exportar Relatório do Rebanho (CSV)',
      });

      return ok(shared);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
