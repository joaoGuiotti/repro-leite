import { and, desc, eq, isNull } from 'drizzle-orm';
import { Result, ok, err } from '@/core/result';
import { getDatabase } from '@core/db/client';
import { withTransaction } from '@core/db/transaction';
import { alerts, animals, bulls, inseminations, settings, weighings } from '@core/db/schema';
import {
  BackupAnimalRecord,
  BackupAlertRecord,
  BackupBullRecord,
  BackupInseminationRecord,
  BackupPayload,
  BackupSettingRecord,
  BackupWeighingRecord,
} from '../domain/backup.types';
import { BackupRepository } from '../domain/backup.repository';
import { CalvesExportRow, HerdExportRow } from '../domain/export.types';

function formatDateBr(isoDate?: string | null): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

export class BackupSqliteRepository implements BackupRepository {
  async exportBackup(farmId: string): Promise<BackupPayload> {
    const db = getDatabase();

    const [
      settingsRows,
      bullsRows,
      animalsRows,
      inseminationsRows,
      weighingsRows,
      alertsRows,
    ] = await Promise.all([
      db.select().from(settings).where(and(eq(settings.farmId, farmId), isNull(settings.deletedAt))),
      db.select().from(bulls).where(and(eq(bulls.farmId, farmId), isNull(bulls.deletedAt))),
      db.select().from(animals).where(and(eq(animals.farmId, farmId), isNull(animals.deletedAt))),
      db.select().from(inseminations).where(and(eq(inseminations.farmId, farmId), isNull(inseminations.deletedAt))),
      db.select().from(weighings).where(and(eq(weighings.farmId, farmId), isNull(weighings.deletedAt))),
      db.select().from(alerts).where(and(eq(alerts.farmId, farmId), isNull(alerts.deletedAt))),
    ]);

    const backupSettings: BackupSettingRecord[] = settingsRows.map((s) => ({
      id: s.id,
      farm_id: s.farmId,
      key: s.key,
      value: s.value,
      updated_at: s.updatedAt,
    }));

    const backupBulls: BackupBullRecord[] = bullsRows.map((b) => ({
      id: b.id,
      farm_id: b.farmId,
      name: b.name,
      code: b.code ?? undefined,
      breed: b.breed,
      doses_available: b.strawsInStock,
      created_at: b.createdAt,
      updated_at: b.updatedAt,
      deleted_at: b.deletedAt,
    }));

    const backupAnimals: BackupAnimalRecord[] = animalsRows.map((a) => ({
      id: a.id,
      farm_id: a.farmId,
      ear_tag: a.earTag,
      name: a.name ?? undefined,
      birth_date: a.birthDate,
      sex: a.sex === 'macho' ? 'male' : 'female',
      mother_id: a.damId,
      father_id: a.sireId,
      maternal_grandmother_name: a.maternalGrandsireName,
      birth_weight_kg: a.birthWeightKg,
      status: a.reproStatus,
      lactation_status: a.lifeStage,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
      deleted_at: a.deletedAt,
    }));

    const backupInseminations: BackupInseminationRecord[] = inseminationsRows.map((i) => ({
      id: i.id,
      farm_id: i.farmId,
      animal_id: i.animalId,
      bull_id: i.bullId ?? '',
      insemination_date: i.date,
      heat_window_start: i.expectedHeatDate,
      heat_window_end: i.expectedHeatDate,
      pregnancy_check_date: i.pregnancyCheckDate,
      expected_calving_date: i.expectedCalvingDate,
      dry_off_date: i.dryOffDate,
      status: i.result,
      pregnancy_result: i.result,
      created_at: i.createdAt,
      updated_at: i.updatedAt,
      deleted_at: i.deletedAt,
    }));

    const backupWeighings: BackupWeighingRecord[] = weighingsRows.map((w) => ({
      id: w.id,
      farm_id: w.farmId,
      animal_id: w.animalId,
      weighing_date: w.date,
      weight_kg: w.weightKg,
      notes: w.notes,
      created_at: w.createdAt,
      updated_at: w.updatedAt,
      deleted_at: w.deletedAt,
    }));

    const backupAlerts: BackupAlertRecord[] = alertsRows.map((al) => ({
      id: al.id,
      farm_id: al.farmId,
      animal_id: al.targetAnimalId,
      alert_type: al.type,
      due_date: al.dueDate,
      resolved: !!al.completedAt,
      resolved_at: al.completedAt,
      created_at: al.createdAt,
      updated_at: al.updatedAt,
    }));

    return {
      metadata: {
        version: 1,
        app: 'repro-leite',
        farm_id: farmId,
        exported_at: new Date().toISOString(),
        app_version: '1.0.0',
      },
      summary: {
        animals_count: backupAnimals.length,
        inseminations_count: backupInseminations.length,
        bulls_count: backupBulls.length,
        weighings_count: backupWeighings.length,
        settings_count: backupSettings.length,
      },
      data: {
        settings: backupSettings,
        bulls: backupBulls,
        animals: backupAnimals,
        inseminations: backupInseminations,
        weighings: backupWeighings,
        alerts: backupAlerts,
      },
    };
  }

  async restoreBackup(payload: BackupPayload): Promise<Result<void, Error>> {
    try {
      const targetFarmId = payload.metadata.farm_id;

      await withTransaction(async (tx) => {
        const executor = tx ?? getDatabase();

        // 1. Delete dependent children first to prevent foreign key errors
        await executor.delete(alerts).where(eq(alerts.farmId, targetFarmId));
        await executor.delete(weighings).where(eq(weighings.farmId, targetFarmId));
        await executor.delete(inseminations).where(eq(inseminations.farmId, targetFarmId));
        await executor.delete(animals).where(eq(animals.farmId, targetFarmId));
        await executor.delete(bulls).where(eq(bulls.farmId, targetFarmId));
        await executor.delete(settings).where(eq(settings.farmId, targetFarmId));

        // 2. Re-insert parent entities
        if (payload.data.settings?.length > 0) {
          for (const s of payload.data.settings) {
            await executor.insert(settings).values({
              id: s.id,
              farmId: targetFarmId,
              key: s.key,
              value: s.value,
              updatedAt: s.updated_at || new Date().toISOString(),
              deletedAt: null,
            });
          }
        }

        if (payload.data.bulls?.length > 0) {
          for (const b of payload.data.bulls) {
            await executor.insert(bulls).values({
              id: b.id,
              farmId: targetFarmId,
              name: b.name,
              code: b.code ?? null,
              breed: b.breed || 'Holandês',
              strawsInStock: b.doses_available ?? 0,
              notes: null,
              createdAt: b.created_at || new Date().toISOString(),
              updatedAt: b.updated_at || new Date().toISOString(),
              deletedAt: b.deleted_at ?? null,
            });
          }
        }

        if (payload.data.animals?.length > 0) {
          for (const a of payload.data.animals) {
            await executor.insert(animals).values({
              id: a.id,
              farmId: targetFarmId,
              earTag: a.ear_tag,
              earTagNormalized: a.ear_tag.trim().toLowerCase(),
              name: a.name ?? null,
              breed: 'Holandês',
              sex: a.sex === 'male' ? 'macho' : 'femea',
              birthDate: a.birth_date || new Date().toISOString().slice(0, 10),
              birthWeightKg: a.birth_weight_kg ?? 40.0,
              lifeStage: a.lactation_status || 'adulta',
              reproStatus: a.status || 'vazia',
              exitStatus: 'ativo',
              exitDate: null,
              exitReason: null,
              sireId: a.father_id ?? null,
              sireName: null,
              damId: a.mother_id ?? null,
              damName: null,
              maternalGrandsireName: a.maternal_grandmother_name ?? null,
              paternalGrandsireName: null,
              notes: null,
              createdAt: a.created_at || new Date().toISOString(),
              updatedAt: a.updated_at || new Date().toISOString(),
              deletedAt: a.deleted_at ?? null,
            });
          }
        }

        // 3. Re-insert child entities
        if (payload.data.inseminations?.length > 0) {
          for (const i of payload.data.inseminations) {
            await executor.insert(inseminations).values({
              id: i.id,
              farmId: targetFarmId,
              animalId: i.animal_id,
              bullId: i.bull_id || null,
              bullName: 'Touro do Catálogo',
              date: i.insemination_date,
              inseminator: 'Inseminador',
              expectedHeatDate: i.heat_window_start,
              pregnancyCheckDate: i.pregnancy_check_date,
              expectedCalvingDate: i.expected_calving_date,
              dryOffDate: i.dry_off_date,
              result: i.pregnancy_result || i.status || 'pendente',
              notes: null,
              createdAt: i.created_at || new Date().toISOString(),
              updatedAt: i.updated_at || new Date().toISOString(),
              deletedAt: i.deleted_at ?? null,
            });
          }
        }

        if (payload.data.weighings?.length > 0) {
          for (const w of payload.data.weighings) {
            await executor.insert(weighings).values({
              id: w.id,
              farmId: targetFarmId,
              animalId: w.animal_id,
              date: w.weighing_date,
              weightKg: w.weight_kg,
              notes: w.notes ?? null,
              createdAt: w.created_at || new Date().toISOString(),
              updatedAt: w.updated_at || new Date().toISOString(),
              deletedAt: w.deleted_at ?? null,
            });
          }
        }

        if (payload.data.alerts?.length > 0) {
          for (const al of payload.data.alerts) {
            await executor.insert(alerts).values({
              id: al.id,
              farmId: targetFarmId,
              targetAnimalId: al.animal_id,
              type: al.alert_type,
              dueDate: al.due_date,
              completedAt: al.resolved_at ?? null,
              sourceId: null,
              notes: null,
              createdAt: al.created_at || new Date().toISOString(),
              updatedAt: al.updated_at || new Date().toISOString(),
              deletedAt: null,
            });
          }
        }
      });

      return ok(undefined);
    } catch (error) {
      console.error('[BackupSqliteRepository] Erro ao restaurar backup:', error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async getHerdExportData(farmId: string): Promise<HerdExportRow[]> {
    const db = getDatabase();

    const cows = await db
      .select()
      .from(animals)
      .where(
        and(
          eq(animals.farmId, farmId),
          eq(animals.exitStatus, 'ativo'),
          isNull(animals.deletedAt)
        )
      );

    const rows: HerdExportRow[] = [];

    for (const cow of cows) {
      // Obter última inseminação da vaca
      const [lastIa] = await db
        .select()
        .from(inseminations)
        .where(
          and(
            eq(inseminations.animalId, cow.id),
            isNull(inseminations.deletedAt)
          )
        )
        .orderBy(desc(inseminations.date))
        .limit(1);

      let reproStatusDesc = 'Vazia';
      if (cow.reproStatus === 'prenhe') reproStatusDesc = 'Prenhe Confirmada';
      else if (cow.reproStatus === 'inseminada') reproStatusDesc = 'Inseminada (Aguardando Toque)';
      else if (cow.reproStatus === 'seca') reproStatusDesc = 'Seca';

      rows.push({
        ear_tag: cow.earTag,
        name: cow.name || '-',
        category: cow.lifeStage === 'adulta' ? 'Vaca' : cow.lifeStage,
        reproductive_status: reproStatusDesc,
        days_in_milk_or_open: '-',
        last_insemination_date: formatDateBr(lastIa?.date),
        bull_name: lastIa?.bullName || '-',
        expected_heat_date: formatDateBr(lastIa?.expectedHeatDate),
        pregnancy_check_date: formatDateBr(lastIa?.pregnancyCheckDate),
        dry_off_date: formatDateBr(lastIa?.dryOffDate),
        expected_calving_date: formatDateBr(lastIa?.expectedCalvingDate),
        notes: cow.notes || '-',
      });
    }

    return rows;
  }

  async getCalvesExportData(farmId: string): Promise<CalvesExportRow[]> {
    const db = getDatabase();

    const calves = await db
      .select()
      .from(animals)
      .where(
        and(
          eq(animals.farmId, farmId),
          isNull(animals.deletedAt)
        )
      );

    const calvesOnly = calves.filter(
      (a) => a.lifeStage === 'bezerra' || a.lifeStage === 'novilha'
    );

    const rows: CalvesExportRow[] = [];

    for (const calf of calvesOnly) {
      // Obter pesagens ordenadas
      const calfWeighings = await db
        .select()
        .from(weighings)
        .where(
          and(
            eq(weighings.animalId, calf.id),
            isNull(weighings.deletedAt)
          )
        )
        .orderBy(desc(weighings.date));

      const lastWeighing = calfWeighings[0];
      let gmdFormatted = '-';

      if (calfWeighings.length >= 2) {
        const w1 = calfWeighings[0];
        const w2 = calfWeighings[1];
        const d1 = new Date(w1.date).getTime();
        const d2 = new Date(w2.date).getTime();
        const diffDays = Math.max(1, Math.round((d1 - d2) / (1000 * 60 * 60 * 24)));
        const gainGrams = (w1.weightKg - w2.weightKg) * 1000;
        const gmd = Math.round(gainGrams / diffDays);
        gmdFormatted = `${gmd} g/dia`;
      }

      rows.push({
        ear_tag: calf.earTag,
        name: calf.name || '-',
        sex: calf.sex === 'macho' ? 'Macho' : 'Fêmea',
        birth_date: formatDateBr(calf.birthDate),
        birth_weight_kg: calf.birthWeightKg ? `${calf.birthWeightKg.toFixed(1).replace('.', ',')} kg` : '40,0 kg',
        mother_ear_tag: calf.damName || '-',
        father_name: calf.sireName || '-',
        maternal_grandmother_name: calf.maternalGrandsireName || '-',
        feeding_stage: calf.lifeStage === 'bezerra' ? 'Aleitamento' : 'Recria',
        daily_milk_liters: calf.lifeStage === 'bezerra' ? '4 a 8 L' : '0 L (Desmamada)',
        last_weight_kg: lastWeighing ? `${lastWeighing.weightKg.toFixed(1).replace('.', ',')} kg` : '-',
        last_weighing_date: formatDateBr(lastWeighing?.date),
        average_daily_gain_g: gmdFormatted,
        breeding_target_weight_kg: '360,0 kg',
        breeding_readiness_status:
          lastWeighing && lastWeighing.weightKg >= 360
            ? 'Apta para 1ª IA'
            : 'Em Recria',
      });
    }

    return rows;
  }
}
