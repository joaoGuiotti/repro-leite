import { BaseEntity } from '@core/db/schema/common';

export interface SettingRecord extends BaseEntity {
  farmId: string;
  key: string;
  value: string;
}

export interface FarmParameters {
  heatWindowDays: number;
  pregnancyCheckDays: number;
  gestationDays: number;
  dryOffDays: number;
}

export const DEFAULT_FARM_PARAMETERS: FarmParameters = {
  heatWindowDays: 21,
  pregnancyCheckDays: 45,
  gestationDays: 282,
  dryOffDays: 60,
};

export function parseFarmParameters(settingsMap: Record<string, string>): FarmParameters {
  return {
    heatWindowDays:
      parseInt(settingsMap['heat_window_days'] || '', 10) ||
      DEFAULT_FARM_PARAMETERS.heatWindowDays,
    pregnancyCheckDays:
      parseInt(settingsMap['pregnancy_check_days'] || '', 10) ||
      DEFAULT_FARM_PARAMETERS.pregnancyCheckDays,
    gestationDays:
      parseInt(settingsMap['gestation_days'] || '', 10) ||
      DEFAULT_FARM_PARAMETERS.gestationDays,
    dryOffDays:
      parseInt(settingsMap['dry_off_days'] || '', 10) ||
      DEFAULT_FARM_PARAMETERS.dryOffDays,
  };
}
