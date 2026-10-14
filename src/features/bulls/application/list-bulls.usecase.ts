import { AppError, ok, Result } from '@core/result';
import { BullRecord } from '../domain/bull.entity';
import { BullRepository } from '../domain/bull.repository';

export class ListBullsUseCase {
  constructor(private repo: BullRepository) {}

  async execute(farmId: string): Promise<Result<BullRecord[], AppError>> {
    try {
      const records = await this.repo.listByFarm(farmId);
      return ok(records);
    } catch {
      return ok([]);
    }
  }
}
