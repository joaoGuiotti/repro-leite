import { AlertSqliteRepository } from '@features/alerts';
import { AnimalSqliteRepository } from '@features/herd';
import { InseminationSqliteRepository } from '@features/insemination';
import { CalfFeedingInputAnimal } from '../domain/feeding-summary';
import { TodayRepository } from '../domain/today.repository';
import { AlertWithReproDetails } from '../domain/today.types';
import { getEnrichedPendingAlerts } from './today.queries';

/**
 * Implementação SQLite do TodayRepository.
 * Centraliza as consultas e comandos específicos de curral.
 */
export class TodayRepositoryImpl implements TodayRepository {
  constructor(
    private alertRepo: {
      complete(id: string): Promise<void>;
      softDeleteBySourceId(sourceId: string): Promise<void>;
    } = new AlertSqliteRepository(),
    private animalRepo: {
      listByFarm(farmId: string, includeInactive?: boolean): Promise<any[]>;
      update(id: string, updates: any): Promise<any>;
    } = new AnimalSqliteRepository(),
    private insemRepo: {
      update(id: string, updates: any): Promise<any>;
    } = new InseminationSqliteRepository()
  ) {}

  async getPendingAlertsEnriched(
    farmId: string,
    referenceDate: string
  ): Promise<AlertWithReproDetails[]> {
    return getEnrichedPendingAlerts(farmId, referenceDate);
  }

  async listAnimalsForFeeding(
    farmId: string
  ): Promise<CalfFeedingInputAnimal[]> {
    const list = await this.animalRepo.listByFarm(farmId, false);
    return list.map((a) => ({
      id: a.id,
      earTag: a.earTag,
      name: a.name,
      sex: a.sex,
      birthDate: a.birthDate,
      exitStatus: a.exitStatus,
    }));
  }

  async completeAlert(id: string): Promise<void> {
    await this.alertRepo.complete(id);
  }

  async cancelAlertsBySourceId(sourceId: string): Promise<void> {
    await this.alertRepo.softDeleteBySourceId(sourceId);
  }

  async updateAnimalReproStatus(
    animalId: string,
    status: 'vazia' | 'inseminada' | 'prenhe' | 'seca'
  ): Promise<void> {
    await this.animalRepo.update(animalId, { reproStatus: status });
  }

  async updateInseminationResult(
    inseminationId: string,
    result: 'pendente' | 'prenhe' | 'vazia'
  ): Promise<void> {
    await this.insemRepo.update(inseminationId, { result });
  }
}
