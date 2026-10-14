import { BaseEntity } from '@core/db/schema/common';

export type AlertType =
  | 'heat_check_21d'
  | 'pregnancy_check_45d'
  | 'calving_due'
  | 'dry_off';

export interface AlertRecord extends BaseEntity {
  targetAnimalId: string;
  type: AlertType;
  dueDate: string; // ISO YYYY-MM-DD
  completedAt?: string | null;
  sourceId?: string | null;
  notes?: string | null;
}

export interface CreateAlertDTO {
  farmId: string;
  targetAnimalId: string;
  type: AlertType;
  dueDate: string; // ISO YYYY-MM-DD
  sourceId?: string | null;
  notes?: string | null;
}
