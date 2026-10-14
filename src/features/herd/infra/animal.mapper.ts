import { Animal } from './animal.schema';
import { AnimalRecord } from '../domain/animal.entity';

export class AnimalMapper {
  static toDomain(raw: Animal): AnimalRecord {
    return {
      id: raw.id,
      farmId: raw.farmId,
      earTag: raw.earTag,
      earTagNormalized: raw.earTagNormalized,
      name: raw.name,
      breed: raw.breed,
      sex: raw.sex as AnimalRecord['sex'],
      birthDate: raw.birthDate,
      birthWeightKg: raw.birthWeightKg,
      lifeStage: raw.lifeStage as AnimalRecord['lifeStage'],
      reproStatus: raw.reproStatus as AnimalRecord['reproStatus'],
      exitStatus: raw.exitStatus as AnimalRecord['exitStatus'],
      exitDate: raw.exitDate,
      exitReason: raw.exitReason,
      sireId: raw.sireId,
      sireName: raw.sireName,
      damId: raw.damId,
      damName: raw.damName,
      maternalGrandsireName: raw.maternalGrandsireName,
      paternalGrandsireName: raw.paternalGrandsireName,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    };
  }

  static toPersistence(entity: AnimalRecord): Animal {
    return {
      id: entity.id,
      farmId: entity.farmId,
      earTag: entity.earTag,
      earTagNormalized: entity.earTagNormalized,
      name: entity.name ?? null,
      breed: entity.breed,
      sex: entity.sex,
      birthDate: entity.birthDate,
      birthWeightKg: entity.birthWeightKg,
      lifeStage: entity.lifeStage,
      reproStatus: entity.reproStatus,
      exitStatus: entity.exitStatus,
      exitDate: entity.exitDate ?? null,
      exitReason: entity.exitReason ?? null,
      sireId: entity.sireId ?? null,
      sireName: entity.sireName ?? null,
      damId: entity.damId ?? null,
      damName: entity.damName ?? null,
      maternalGrandsireName: entity.maternalGrandsireName ?? null,
      paternalGrandsireName: entity.paternalGrandsireName ?? null,
      notes: entity.notes ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }
}
