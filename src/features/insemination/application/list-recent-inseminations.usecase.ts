import { AppError, ok, Result } from '@core/result';
import { InseminationWithAnimalSummary } from '../domain/insemination.entity';
import { InseminationRepository } from '../domain/insemination.repository';

export class ListRecentInseminationsUseCase {
  constructor(private repo: InseminationRepository) {}

  async execute(
    farmId: string,
    limit: number = 20
  ): Promise<Result<InseminationWithAnimalSummary[], AppError>> {
    try {
      const records = await this.repo.listRecentByFarm(farmId, limit);
      return ok(records);
    } catch {
      return ok([]);
    }
  }
}
