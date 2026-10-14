import { and, eq, isNull } from 'drizzle-orm';
import { getDatabase } from '@core/db/client';
import { animals } from '@core/db/schema/animals';
import {
  CalfEnrichedRow,
  CalvesRepository,
} from '../domain/calves.repository';
import {
  BullOption,
  CowOption,
  CreateCalfDTO,
  CreateWeighingDTO,
  WeighingRecord,
} from '../domain/calves.types';
import {
  getCalfById,
  getEnrichedCalvesList,
  getWeighingsByAnimal,
  getAvailableBulls,
  getAvailableCows,
  ensureWeighingsTableExists,
} from './calves.queries';
import { weighings } from './weighings.schema';

/**
 * Implementação SQLite do repositório de bezerras e recria.
 */
export class CalvesRepositoryImpl implements CalvesRepository {
  async listCalvesByFarm(
    farmId: string,
    includeInactive: boolean = false
  ): Promise<CalfEnrichedRow[]> {
    return getEnrichedCalvesList(farmId, includeInactive);
  }

  async findCalfById(id: string): Promise<CalfEnrichedRow | null> {
    return getCalfById(id);
  }

  async findByEarTag(
    farmId: string,
    earTagNormalized: string
  ): Promise<CalfEnrichedRow | null> {
    const db = getDatabase();
    const rows = await db
      .select({
        id: animals.id,
      })
      .from(animals)
      .where(
        and(
          eq(animals.farmId, farmId),
          eq(animals.earTagNormalized, earTagNormalized),
          isNull(animals.deletedAt),
          eq(animals.exitStatus, 'ativo')
        )
      )
      .limit(1);

    if (rows.length === 0) return null;
    return this.findCalfById(rows[0].id);
  }

  async saveCalf(calf: CreateCalfDTO): Promise<void> {
    const db = getDatabase();
    await db.insert(animals).values({
      id: calf.id,
      farmId: calf.farmId,
      earTag: calf.earTag,
      earTagNormalized: calf.earTagNormalized,
      name: calf.name,
      breed: calf.breed,
      sex: calf.sex,
      birthDate: calf.birthDate,
      birthWeightKg: calf.birthWeightKg,
      lifeStage: calf.lifeStage,
      reproStatus: calf.reproStatus,
      exitStatus: calf.exitStatus,
      sireId: calf.sireId,
      sireName: calf.sireName,
      damId: calf.damId,
      damName: calf.damName,
      maternalGrandsireName: calf.maternalGrandsireName,
      notes: calf.notes,
      createdAt: calf.createdAt,
      updatedAt: calf.updatedAt,
    });
  }

  async updateCalf(
    id: string,
    updates: Partial<CreateCalfDTO>
  ): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    await db
      .update(animals)
      .set({
        ...updates,
        updatedAt: updates.updatedAt ?? now,
      })
      .where(eq(animals.id, id));
  }

  async softDeleteCalf(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    await db
      .update(animals)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(animals.id, id));
  }

  async listWeighingsByAnimal(animalId: string): Promise<WeighingRecord[]> {
    return getWeighingsByAnimal(animalId);
  }

  async saveWeighing(weighing: CreateWeighingDTO): Promise<void> {
    ensureWeighingsTableExists();
    const db = getDatabase();
    await db.insert(weighings).values({
      id: weighing.id,
      farmId: weighing.farmId,
      animalId: weighing.animalId,
      date: weighing.date,
      weightKg: weighing.weightKg,
      notes: weighing.notes,
      createdAt: weighing.createdAt,
      updatedAt: weighing.updatedAt,
    });
  }

  async softDeleteWeighing(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    await db
      .update(weighings)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(weighings.id, id));
  }

  async getAvailableBulls(farmId: string): Promise<BullOption[]> {
    return getAvailableBulls(farmId);
  }

  async getAvailableCows(farmId: string): Promise<CowOption[]> {
    return getAvailableCows(farmId);
  }
}

