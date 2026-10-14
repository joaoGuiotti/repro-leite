export interface SettingRepository {
  get(farmId: string, key: string): Promise<string | null>;
  getAll(farmId: string): Promise<Record<string, string>>;
  set(farmId: string, key: string, value: string): Promise<void>;
}
