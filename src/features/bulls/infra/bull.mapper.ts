import { BullRecord } from '../domain/bull.entity';
import { bulls } from './bull.schema';

export type BullPersistence = typeof bulls.$inferSelect;
export type NewBullPersistence = typeof bulls.$inferInsert;

export class BullMapper {
  static toDomain(raw: BullPersistence): BullRecord {
    return {
      id: raw.id,
      farmId: raw.farmId,
      name: raw.name,
      breed: raw.breed,
      code: raw.code ?? null,
      strawsInStock: raw.strawsInStock,
      notes: raw.notes ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt ?? null,
    };
  }

  static toPersistence(entity: BullRecord): NewBullPersistence {
    return {
      id: entity.id,
      farmId: entity.farmId,
      name: entity.name,
      breed: entity.breed,
      code: entity.code,
      strawsInStock: entity.strawsInStock,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
