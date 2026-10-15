export interface HerdExportRow {
  ear_tag: string;
  name: string;
  category: string;
  reproductive_status: string;
  days_in_milk_or_open: string;
  last_insemination_date: string;
  bull_name: string;
  expected_heat_date: string;
  pregnancy_check_date: string;
  dry_off_date: string;
  expected_calving_date: string;
  notes: string;
}

export interface CalvesExportRow {
  ear_tag: string;
  name: string;
  sex: string;
  birth_date: string;
  birth_weight_kg: string;
  mother_ear_tag: string;
  father_name: string;
  maternal_grandmother_name: string;
  feeding_stage: string;
  daily_milk_liters: string;
  last_weight_kg: string;
  last_weighing_date: string;
  average_daily_gain_g: string;
  breeding_target_weight_kg: string;
  breeding_readiness_status: string;
}
