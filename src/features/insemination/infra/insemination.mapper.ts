import {
  InseminationRecord,
  InseminationResult,
} from '../domain/insemination.entity';
import { inseminations } from './insemination.schema';

export type InseminationPersistence = typeof inseminations.$inferSelect;
export type NewInseminationPersistence = typeof inseminations.$inferInsert;

export class InseminationMapper {
  static toDomain(raw: InseminationPersistence): InseminationRecord {
    return {
      id: raw.id,
      farmId: raw.farmId,
      animalId: raw.animalId,
      bullId: raw.bullId ?? null,
      bullName: raw.bullName,
      date: raw.date,
      inseminator: raw.inseminator,
      expectedHeatDate: raw.expectedHeatDate,
      pregnancyCheckDate: raw.pregnancyCheckDate,
      expectedCalvingDate: raw.expectedCalvingDate,
      dryOffDate: raw.dryOffDate,
      result: raw.result as InseminationResult,
      notes: raw.notes ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt ?? null,
    };
  }

  static toPersistence(entity: InseminationRecord): NewInseminationPersistence {
    return {
      id: entity.id,
      farmId: entity.farmId,
      animalId: entity.animalId,
      bullId: entity.bullId,
      bullName: entity.bullName,
      date: entity.date,
      inseminator: entity.inseminator,
      expectedHeatDate: entity.expectedHeatDate,
      pregnancyCheckDate: entity.pregnancyCheckDate,
      expectedCalvingDate: entity.expectedCalvingDate,
      dryOffDate: entity.dryOffDate,
      result: entity.result,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
