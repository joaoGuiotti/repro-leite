import { AppError, appError, err, ok, Result } from '@core/result';
import { CalvesRepository } from '../domain/calves.repository';
import { BullOption, CowOption } from '../domain/calves.types';

export interface BreedingOptionsResult {
  bulls: BullOption[];
  cows: CowOption[];
}

export class GetBreedingOptionsUseCase {
  constructor(private repo: CalvesRepository) {}

  async execute(
    farmId: string
  ): Promise<Result<BreedingOptionsResult, AppError>> {
    if (!farmId) {
      return err(appError('INVALID_FARM', 'Identificador da fazenda é obrigatório.'));
    }

    try {
      const [bulls, cows] = await Promise.all([
        this.repo.getAvailableBulls(farmId),
        this.repo.getAvailableCows(farmId),
      ]);

      return ok({ bulls, cows });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao buscar touros e vacas.';
      return err(appError('DB_ERROR', msg));
    }
  }
}
