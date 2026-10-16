export interface BackupMetadata {
  version: number;
  app: 'repro-leite';
  farm_id: string;
  exported_at: string;
  app_version?: string;
}

export interface BackupSummary {
  animals_count: number;
  inseminations_count: number;
  bulls_count: number;
  weighings_count: number;
  settings_count: number;
}

export interface BackupSettingRecord {
  id: string;
  farm_id: string;
  key: string;
  value: string;
  created_at?: string;
  updated_at: string;
}

export interface BackupBullRecord {
  id: string;
  farm_id: string;
  name: string;
  code?: string;
  breed?: string;
  doses_available: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface BackupAnimalRecord {
  id: string;
  farm_id: string;
  ear_tag: string;
  name?: string;
  birth_date?: string;
  sex: 'female' | 'male';
  mother_id?: string | null;
  father_id?: string | null;
  maternal_grandmother_name?: string | null;
  birth_weight_kg?: number | null;
  status: string;
  lactation_status: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface BackupInseminationRecord {
  id: string;
  farm_id: string;
  animal_id: string;
  bull_id: string;
  insemination_date: string;
  heat_window_start: string;
  heat_window_end: string;
  pregnancy_check_date: string;
  expected_calving_date: string;
  dry_off_date: string;
  status: string;
  pregnancy_result?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface BackupWeighingRecord {
  id: string;
  farm_id: string;
  animal_id: string;
  weighing_date: string;
  weight_kg: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface BackupAlertRecord {
  id: string;
  farm_id: string;
  animal_id: string;
  alert_type: string;
  due_date: string;
  resolved: boolean;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackupPayload {
  metadata: BackupMetadata;
  summary: BackupSummary;
  data: {
    settings: BackupSettingRecord[];
    bulls: BackupBullRecord[];
    animals: BackupAnimalRecord[];
    inseminations: BackupInseminationRecord[];
    weighings: BackupWeighingRecord[];
    alerts: BackupAlertRecord[];
  };
}
