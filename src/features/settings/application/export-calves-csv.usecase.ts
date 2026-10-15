import { Result, ok, err } from '@/core/result';
import { BackupRepository } from '../domain/backup.repository';
import { FileShareService } from '../domain/file-share.service';
import { formatCsvContent } from '../domain/engines/format-csv';

export interface ExportCalvesCsvInput {
  farmId: string;
}

export class ExportCalvesCsvUseCase {
  constructor(
    private backupRepo: BackupRepository,
    private shareService: FileShareService
  ) {}

  async execute(input: ExportCalvesCsvInput): Promise<Result<boolean, Error>> {
    try {
      const data = await this.backupRepo.getCalvesExportData(input.farmId);

      const columns = [
        { key: 'ear_tag', label: 'BRINCO' },
        { key: 'name', label: 'NOME' },
        { key: 'sex', label: 'SEXO' },
        { key: 'birth_date', label: 'DATA_NASCIMENTO' },
        { key: 'birth_weight_kg', label: 'PESO_NASCIMENTO' },
        { key: 'mother_ear_tag', label: 'BRINCO_MAE' },
        { key: 'father_name', label: 'PAI' },
        { key: 'maternal_grandmother_name', label: 'AVO_MATERNA' },
        { key: 'feeding_stage', label: 'FASE_ALEITAMENTO' },
        { key: 'daily_milk_liters', label: 'LEITE_DIARIO' },
        { key: 'last_weight_kg', label: 'ULTIMO_PESO' },
        { key: 'last_weighing_date', label: 'DATA_ULTIMA_PESAGEM' },
        { key: 'average_daily_gain_g', label: 'GMD' },
        { key: 'breeding_target_weight_kg', label: 'META_PESO_1A_IA' },
        { key: 'breeding_readiness_status', label: 'STATUS_REPRODUTIVO' },
      ];

      const csvString = formatCsvContent(data, columns);
      const dateSuffix = new Date().toISOString().slice(0, 10);
      const filename = `bezerras_export_${dateSuffix}.csv`;

      const shared = await this.shareService.shareFile({
        filename,
        content: csvString,
        mimeType: 'text/csv',
        dialogTitle: 'Exportar Relatório das Bezerras (CSV)',
      });

      return ok(shared);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
