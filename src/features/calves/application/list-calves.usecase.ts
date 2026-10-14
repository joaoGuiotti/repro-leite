import { AppError, appError, err, ok, Result } from '@core/result';
import { CalvesRepository } from '../domain/calves.repository';
import {
  CalfListItem,
  TARGET_FIRST_BREEDING_WEIGHT_KG,
} from '../domain/calves.types';
import { calculateCalfFeedingPlan } from '../domain/calf-feeding';
import { evaluateLifeStage } from '../domain/calf-weight';

export interface ListCalvesInput {
  farmId: string;
  referenceDate?: string;
  sexFilter?: 'todos' | 'femeas' | 'machos';
  searchQuery?: string;
  includeInactive?: boolean;
}

export interface ListCalvesResult {
  items: CalfListItem[];
  totalCalvesCount: number;
  totalHeifersCount: number;
  totalLitersToday: number;
}

export class ListCalvesUseCase {
  constructor(private repo: CalvesRepository) {}

  async execute(
    input: ListCalvesInput
  ): Promise<Result<ListCalvesResult, AppError>> {
    if (!input.farmId) {
      return err(appError('INVALID_FARM', 'Identificador da fazenda é obrigatório.'));
    }

    const refDate =
      input.referenceDate || new Date().toISOString().split('T')[0];

    const rawRows = await this.repo.listCalvesByFarm(
      input.farmId,
      input.includeInactive
    );

    const q = input.searchQuery?.trim().toLowerCase();

    let totalCalvesCount = 0;
    let totalHeifersCount = 0;
    let totalLitersToday = 0;

    const items: CalfListItem[] = [];

    for (const row of rawRows) {
      const feedingPlan = calculateCalfFeedingPlan(row.birthDate, refDate);
      const evaluatedLifeStage = evaluateLifeStage(feedingPlan.ageInDays);
      const weight = row.lastWeightKg ?? row.birthWeightKg;
      const isReadyForBreeding =
        row.sex === 'femea' && weight >= TARGET_FIRST_BREEDING_WEIGHT_KG;

      // Contadores globais da fazenda
      if (evaluatedLifeStage === 'bezerra') {
        totalCalvesCount++;
      } else {
        totalHeifersCount++;
      }
      totalLitersToday += feedingPlan.totalDailyLiters;

      // Filtro de Sexo
      if (input.sexFilter === 'femeas' && row.sex !== 'femea') continue;
      if (input.sexFilter === 'machos' && row.sex !== 'macho') continue;

      // Filtro de Busca Textual
      if (q) {
        const matchEarTag = row.earTag.toLowerCase().includes(q);
        const matchName = row.name ? row.name.toLowerCase().includes(q) : false;
        const matchSire = row.sireName ? row.sireName.toLowerCase().includes(q) : false;
        const matchDam = row.damName ? row.damName.toLowerCase().includes(q) : false;
        if (!matchEarTag && !matchName && !matchSire && !matchDam) {
          continue;
        }
      }

      items.push({
        id: row.id,
        farmId: row.farmId,
        earTag: row.earTag,
        name: row.name,
        sex: row.sex,
        breed: row.breed,
        birthDate: row.birthDate,
        birthWeightKg: row.birthWeightKg,
        lifeStage: evaluatedLifeStage,
        reproStatus: row.reproStatus,
        sireName: row.sireName,
        damName: row.damName,
        ageInDays: feedingPlan.ageInDays,
        ageInMonths: feedingPlan.ageInMonths,
        feedingStage: feedingPlan.stage,
        phaseName: feedingPlan.phaseName,
        dailyLiters: feedingPlan.totalDailyLiters,
        lastWeightKg: row.lastWeightKg,
        isReadyForBreeding,
      });
    }

    return ok({
      items,
      totalCalvesCount,
      totalHeifersCount,
      totalLitersToday,
    });
  }
}
