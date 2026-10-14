import { AppError, ok, Result } from '@core/result';
import { AnimalFilterOptions, AnimalRecord } from '../domain/animal.entity';
import { AnimalRepository } from '../domain/animal.repository';
import { filterAnimals } from '../domain/animal-filters';

export class ListAnimalsUseCase {
  constructor(private repo: AnimalRepository) {}

  async execute(
    farmId: string,
    options: AnimalFilterOptions = {}
  ): Promise<Result<AnimalRecord[], AppError>> {
    try {
      const records = await this.repo.listByFarm(farmId, options.showInactive ?? true);
      const filtered = filterAnimals(records, options);
      return ok(filtered);
    } catch {
      return ok([]);
    }
  }
}
