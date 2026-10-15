import { Result, ok, err } from '@/core/result';
import { BackupRepository } from '../domain/backup.repository';
import { FileShareService } from '../domain/file-share.service';

export interface CopyBackupInput {
  farmId: string;
}

export class CopyBackupToClipboardUseCase {
  constructor(
    private backupRepo: BackupRepository,
    private shareService: FileShareService
  ) {}

  async execute(input: CopyBackupInput): Promise<Result<void, Error>> {
    try {
      const payload = await this.backupRepo.exportBackup(input.farmId);
      const jsonContent = JSON.stringify(payload);

      await this.shareService.copyToClipboard(jsonContent);
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
