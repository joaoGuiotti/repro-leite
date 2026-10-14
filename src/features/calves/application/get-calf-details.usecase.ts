import { AppError, appError, err, ok, Result } from '@core/result';
import { CalvesRepository } from '../domain/calves.repository';
import { CalfWithDetails } from '../domain/calves.types';
import { calculateCalfFeedingPlan, generateWeaningTimeline } from '../domain/calf-feeding';
import { calculateGrowthMetrics, evaluateLifeStage } from '../domain/calf-weight';

export interface GetCalfDetailsInput {
  calfId: string;
  referenceDate?: string; // YYYY-MM-DD (simulada ou real)
}

export class GetCalfDetailsUseCase {
  constructor(private repo: CalvesRepository) {}

  async execute(
    input: GetCalfDetailsInput
  ): Promise<Result<CalfWithDetails, AppError>> {
    if (!input.calfId) {
      return err(appError('INVALID_INPUT', 'ID do animal é obrigatório.'));
    }

    const calf = await this.repo.findCalfById(input.calfId);
    if (!calf) {
      return err(appError('CALF_NOT_FOUND', 'Animal não encontrado no rebanho.'));
    }

    const refDate =
      input.referenceDate || new Date().toISOString().split('T')[0];

    // Cálculos determinísticos puros
    const feedingPlan = calculateCalfFeedingPlan(calf.birthDate, refDate);
    const weaningTimeline = generateWeaningTimeline(calf.birthDate, refDate);
    const weighings = await this.repo.listWeighingsByAnimal(input.calfId);
    const growthMetrics = calculateGrowthMetrics(
      calf.birthWeightKg,
      calf.birthDate,
      weighings,
      calf.sex
    );

    // Avaliação automática de fase (bezerra -> novilha após desmame aos 122 dias)
    const evaluatedStage = evaluateLifeStage(feedingPlan.ageInDays);

    const details: CalfWithDetails = {
      id: calf.id,
      farmId: calf.farmId,
      earTag: calf.earTag,
      name: calf.name,
      sex: calf.sex,
      breed: calf.breed,
      birthDate: calf.birthDate,
      birthWeightKg: calf.birthWeightKg,
      lifeStage: evaluatedStage,
      reproStatus: calf.reproStatus,
      sireId: calf.sireId,
      sireName: calf.sireName,
      damId: calf.damId,
      damName: calf.damName,
      damEarTag: calf.damEarTag,
      maternalGranddamName: calf.maternalGranddamName,
      notes: calf.notes,
      feedingPlan,
      weaningTimeline,
      growthMetrics,
      weighingsHistory: weighings,
    };

    return ok(details);
  }
}
