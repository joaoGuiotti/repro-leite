import { BaseEntity } from '@core/db/schema/common';

export type InseminationResult = 'pendente' | 'prenhe' | 'vazia';

export interface InseminationRecord extends BaseEntity {
  animalId: string;
  bullId: string | null;
  bullName: string;
  date: string; // ISO YYYY-MM-DD
  inseminator: string;
  expectedHeatDate: string; // YYYY-MM-DD (date + 21d)
  pregnancyCheckDate: string; // YYYY-MM-DD (date + 45d)
  expectedCalvingDate: string; // YYYY-MM-DD (date + 282d)
  dryOffDate: string; // YYYY-MM-DD (calving - 60d = date + 222d)
  result: InseminationResult;
  notes?: string | null;
}

export interface CreateInseminationDTO {
  animalId: string;
  bullId?: string | null;
  bullName: string;
  date: string; // ISO YYYY-MM-DD
  inseminator: string;
  notes?: string | null;
}

export interface InseminationMilestones {
  expectedHeatDate: string; // date + 21d
  pregnancyCheckDate: string; // date + 45d
  expectedCalvingDate: string; // date + 282d
  dryOffDate: string; // date + 222d
  heatDaysOffset: number; // 21
  pregnancyCheckDaysOffset: number; // 45
  calvingDaysOffset: number; // 282
  dryOffDaysOffset: number; // 222
}

export interface ConsanguinityCheckResult {
  isConsanguineous: boolean;
  degree?: '1st_degree' | '2nd_degree';
  relation?: 'pai' | 'avo_materno' | 'avo_paterno';
  warningMessage?: string;
}
