import { getDatabase, getExpoDatabase } from '@core/db/client';
import { animals } from '@core/db/schema/animals';
import { bulls } from '@core/db/schema/bulls';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { CalfEnrichedRow } from '../domain/calves.repository';
import { WeighingRecord } from '../domain/calves.types';
import { weighings } from './weighings.schema';

let tableChecked = false;

export function ensureWeighingsTableExists(): void {
  if (tableChecked) return;
  try {
    const rawDb = getExpoDatabase();
    if (typeof rawDb?.execSync === 'function') {
      rawDb.execSync(`
        CREATE TABLE IF NOT EXISTS weighings (
          id TEXT PRIMARY KEY NOT NULL,
          farm_id TEXT NOT NULL REFERENCES farms(id),
          animal_id TEXT NOT NULL REFERENCES animals(id),
          date TEXT NOT NULL,
          weight_kg REAL NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_weighings_animal_date ON weighings (animal_id, date);
        CREATE INDEX IF NOT EXISTS idx_weighings_farm_deleted ON weighings (farm_id, deleted_at);
      `);
      tableChecked = true;
    }
  } catch {
    // Fallback silencioso (ex: SQLite em memória nos testes unitários)
  }
}

/**
 * Busca todas as bezerras e novilhas ativas da fazenda com dados de genealogia e última pesagem.
 */
export async function getEnrichedCalvesList(
  farmId: string,
  includeInactive: boolean = false
): Promise<CalfEnrichedRow[]> {
  ensureWeighingsTableExists();
  const db = getDatabase();

  // Condição para animais: bezerra ou novilha da fazenda
  const whereConditions = [
    eq(animals.farmId, farmId),
    inArray(animals.lifeStage, ['bezerra', 'novilha']),
    isNull(animals.deletedAt),
  ];

  if (!includeInactive) {
    whereConditions.push(eq(animals.exitStatus, 'ativo'));
  }

  const calfRows = await db
    .select({
      id: animals.id,
      farmId: animals.farmId,
      earTag: animals.earTag,
      earTagNormalized: animals.earTagNormalized,
      name: animals.name,
      breed: animals.breed,
      sex: animals.sex,
      birthDate: animals.birthDate,
      birthWeightKg: animals.birthWeightKg,
      lifeStage: animals.lifeStage,
      reproStatus: animals.reproStatus,
      exitStatus: animals.exitStatus,
      sireId: animals.sireId,
      sireName: animals.sireName,
      damId: animals.damId,
      damName: animals.damName,
      maternalGranddamName: animals.maternalGrandsireName,
      notes: animals.notes,
      createdAt: animals.createdAt,
      updatedAt: animals.updatedAt,
    })
    .from(animals)
    .where(and(...whereConditions))
    .orderBy(desc(animals.birthDate), desc(animals.createdAt));

  if (calfRows.length === 0) {
    return [];
  }

  // Busca a última pesagem de cada animal
  const animalIds = calfRows.map((c) => c.id);
  const weighingsList = await db
    .select({
      animalId: weighings.animalId,
      weightKg: weighings.weightKg,
      date: weighings.date,
    })
    .from(weighings)
    .where(
      and(
        inArray(weighings.animalId, animalIds),
        isNull(weighings.deletedAt)
      )
    )
    .orderBy(desc(weighings.date), desc(weighings.createdAt));

  // Agrupa a última pesagem por animalId
  const latestWeightMap = new Map<string, { weightKg: number; date: string }>();
  for (const w of weighingsList) {
    if (!latestWeightMap.has(w.animalId)) {
      latestWeightMap.set(w.animalId, { weightKg: w.weightKg, date: w.date });
    }
  }

  return calfRows.map((r) => {
    const latestWeight = latestWeightMap.get(r.id);
    return {
      id: r.id,
      farmId: r.farmId,
      earTag: r.earTag,
      earTagNormalized: r.earTagNormalized,
      name: r.name,
      breed: r.breed,
      sex: r.sex as 'femea' | 'macho',
      birthDate: r.birthDate,
      birthWeightKg: r.birthWeightKg,
      lifeStage: r.lifeStage as 'bezerra' | 'novilha',
      reproStatus: r.reproStatus,
      exitStatus: r.exitStatus,
      sireId: r.sireId,
      sireName: r.sireName,
      damId: r.damId,
      damName: r.damName,
      maternalGranddamName: r.maternalGranddamName,
      notes: r.notes,
      lastWeightKg: latestWeight ? latestWeight.weightKg : r.birthWeightKg,
      lastWeightDate: latestWeight ? latestWeight.date : r.birthDate,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });
}

/**
 * Busca os dados completos de uma bezerra ou novilha pelo ID.
 */
export async function getCalfById(id: string): Promise<CalfEnrichedRow | null> {
  ensureWeighingsTableExists();
  const db = getDatabase();

  const rows = await db
    .select({
      id: animals.id,
      farmId: animals.farmId,
      earTag: animals.earTag,
      earTagNormalized: animals.earTagNormalized,
      name: animals.name,
      breed: animals.breed,
      sex: animals.sex,
      birthDate: animals.birthDate,
      birthWeightKg: animals.birthWeightKg,
      lifeStage: animals.lifeStage,
      reproStatus: animals.reproStatus,
      exitStatus: animals.exitStatus,
      sireId: animals.sireId,
      sireName: animals.sireName,
      damId: animals.damId,
      damName: animals.damName,
      maternalGranddamName: animals.maternalGrandsireName,
      notes: animals.notes,
      createdAt: animals.createdAt,
      updatedAt: animals.updatedAt,
    })
    .from(animals)
    .where(and(eq(animals.id, id), isNull(animals.deletedAt)))
    .limit(1);

  if (rows.length === 0) return null;

  const r = rows[0];

  // Busca última pesagem
  const latestWeight = await db
    .select({
      weightKg: weighings.weightKg,
      date: weighings.date,
    })
    .from(weighings)
    .where(and(eq(weighings.animalId, id), isNull(weighings.deletedAt)))
    .orderBy(desc(weighings.date), desc(weighings.createdAt))
    .limit(1);

  return {
    id: r.id,
    farmId: r.farmId,
    earTag: r.earTag,
    earTagNormalized: r.earTagNormalized,
    name: r.name,
    breed: r.breed,
    sex: r.sex as 'femea' | 'macho',
    birthDate: r.birthDate,
    birthWeightKg: r.birthWeightKg,
    lifeStage: r.lifeStage as 'bezerra' | 'novilha',
    reproStatus: r.reproStatus,
    exitStatus: r.exitStatus,
    sireId: r.sireId,
    sireName: r.sireName,
    damId: r.damId,
    damName: r.damName,
    maternalGranddamName: r.maternalGranddamName,
    notes: r.notes,
    lastWeightKg: latestWeight.length > 0 ? latestWeight[0].weightKg : r.birthWeightKg,
    lastWeightDate: latestWeight.length > 0 ? latestWeight[0].date : r.birthDate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/**
 * Busca histórico cronológico de pesagens de um animal.
 */
export async function getWeighingsByAnimal(animalId: string): Promise<WeighingRecord[]> {
  ensureWeighingsTableExists();
  const db = getDatabase();

  const rows = await db
    .select({
      id: weighings.id,
      farmId: weighings.farmId,
      animalId: weighings.animalId,
      date: weighings.date,
      weightKg: weighings.weightKg,
      notes: weighings.notes,
      createdAt: weighings.createdAt,
    })
    .from(weighings)
    .where(and(eq(weighings.animalId, animalId), isNull(weighings.deletedAt)))
    .orderBy(desc(weighings.date), desc(weighings.createdAt));

  return rows.map((w) => ({
    id: w.id,
    farmId: w.farmId,
    animalId: w.animalId,
    date: w.date,
    weightKg: w.weightKg,
    notes: w.notes,
    createdAt: w.createdAt,
  }));
}

/**
 * Busca touros disponíveis para paternidade.
 */
export async function getAvailableBulls(
  farmId: string
): Promise<{ id: string; name: string; breed?: string | null }[]> {
  const db = getDatabase();
  const rows = await db
    .select({
      id: bulls.id,
      name: bulls.name,
      breed: bulls.breed,
    })
    .from(bulls)
    .where(and(eq(bulls.farmId, farmId), isNull(bulls.deletedAt)))
    .orderBy(bulls.name);

  return rows;
}

/**
 * Busca vacas disponíveis do rebanho para maternidade.
 */
export async function getAvailableCows(
  farmId: string
): Promise<{ id: string; earTag: string; name?: string | null; maternalGranddamName?: string | null }[]> {
  const db = getDatabase();
  const rows = await db
    .select({
      id: animals.id,
      earTag: animals.earTag,
      name: animals.name,
      maternalGranddamName: animals.maternalGrandsireName,
    })
    .from(animals)
    .where(
      and(
        eq(animals.farmId, farmId),
        eq(animals.sex, 'femea'),
        isNull(animals.deletedAt)
      )
    )
    .orderBy(animals.earTag);

  return rows;
}

