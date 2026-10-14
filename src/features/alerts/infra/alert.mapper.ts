import { AlertRecord, AlertType, AlertWithAnimalSummary } from '../domain/alert.entity';
import { Alert } from './alert.schema';

export class AlertMapper {
  static toDomain(raw: Alert): AlertRecord {
    return {
      id: raw.id,
      farmId: raw.farmId,
      targetAnimalId: raw.targetAnimalId,
      type: raw.type as AlertType,
      dueDate: raw.dueDate,
      completedAt: raw.completedAt ?? null,
      sourceId: raw.sourceId ?? null,
      notes: raw.notes ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt ?? null,
    };
  }

  static toDomainWithAnimal(
    rawAlert: Alert,
    rawAnimal: { earTag: string; name: string | null }
  ): AlertWithAnimalSummary {
    return {
      ...this.toDomain(rawAlert),
      animalEarTag: rawAnimal.earTag,
      animalName: rawAnimal.name,
    };
  }
}
