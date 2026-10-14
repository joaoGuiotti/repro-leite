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

export interface AlertWithAnimalSummary extends AlertRecord {
  animalEarTag: string;
  animalName?: string | null;
}

export interface AlertTypeMeta {
  label: string;
  badgeLabel: string;
  description: string;
  colorVariant: 'alerta' | 'atencao' | 'sucesso' | 'info';
}

export const ALERT_TYPE_METAS: Record<AlertType, AlertTypeMeta> = {
  heat_check_21d: {
    label: 'Retorno de Cio (21d)',
    badgeLabel: 'Cio 21d',
    description: 'Vigiar sintomas de cio pós-inseminação',
    colorVariant: 'atencao',
  },
  pregnancy_check_45d: {
    label: 'Toque Veterinário (45d)',
    badgeLabel: 'Toque 45d',
    description: 'Diagnóstico gestacional por palpação ou ultrassom',
    colorVariant: 'info',
  },
  calving_due: {
    label: 'Previsão de Parto',
    badgeLabel: 'Parto Previsto',
    description: 'Separar no piquete maternidade e monitorar',
    colorVariant: 'alerta',
  },
  dry_off: {
    label: 'Secagem Programada',
    badgeLabel: 'Secagem',
    description: 'Interromper ordenha 60 dias antes do parto',
    colorVariant: 'sucesso',
  },
};

/**
 * Retorna se o alerta está vencido ou deve ser realizado até a data de referência.
 */
export function isAlertDue(dueDate: string, referenceDate: string): boolean {
  return dueDate <= referenceDate;
}

/**
 * Retorna os metadados visuais de um tipo de alerta zootécnico.
 */
export function getAlertTypeMeta(type: AlertType): AlertTypeMeta {
  return (
    ALERT_TYPE_METAS[type] ?? {
      label: type,
      badgeLabel: type,
      description: '',
      colorVariant: 'atencao',
    }
  );
}
