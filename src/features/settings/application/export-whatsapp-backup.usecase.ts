import { Result, ok, err } from '@/core/result';
import { BackupRepository } from '../domain/backup.repository';
import { FileShareService } from '../domain/file-share.service';

export interface ExportWhatsAppBackupInput {
  farmId: string;
}

export class ExportWhatsAppBackupUseCase {
  constructor(
    private backupRepo: BackupRepository,
    private shareService: FileShareService
  ) {}

  async execute(input: ExportWhatsAppBackupInput): Promise<Result<boolean, Error>> {
    try {
      const payload = await this.backupRepo.exportBackup(input.farmId);
      const jsonContent = JSON.stringify(payload, null, 2);

      const dateSuffix = new Date().toISOString().slice(0, 10);
      const filename = `backup_reproleite_${dateSuffix}.json`;

      const shared = await this.shareService.shareFile({
        filename,
        content: jsonContent,
        mimeType: 'application/json',
        dialogTitle: 'Exportar Backup para WhatsApp (JSON)',
      });

      return ok(shared);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
