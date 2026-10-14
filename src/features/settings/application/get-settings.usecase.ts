import { AppError, appError, err, ok, Result } from '@core/result';
import {
  FarmParameters,
  parseFarmParameters,
} from '../domain/setting.entity';
import { SettingRepository } from '../domain/setting.repository';

export class GetSettingsUseCase {
  constructor(private repo: SettingRepository) {}

  async execute(farmId: string): Promise<Result<FarmParameters, AppError>> {
    if (!farmId) {
      return err(appError('VALIDATION_ERROR', 'ID da fazenda é obrigatório.'));
    }

    try {
      const all = await this.repo.getAll(farmId);
      const parsed = parseFarmParameters(all);
      return ok(parsed);
    } catch (e: any) {
      return err(
        appError(
          'INTERNAL_ERROR',
          e.message || 'Falha ao carregar configurações da fazenda.'
        )
      );
    }
  }
}
