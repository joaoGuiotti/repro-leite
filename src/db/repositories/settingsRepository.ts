import { getSettingsUseCases } from '@features/settings';

export class SettingsRepository {
  /**
   * Obtém o valor de um parâmetro da fazenda.
   */
  static async getSetting(
    farmId: string,
    key: string,
    defaultValue?: string
  ): Promise<string | null> {
    const val = await getSettingsUseCases().repo.get(farmId, key);
    return val ?? defaultValue ?? null;
  }

  /**
   * Salva ou atualiza um parâmetro da fazenda (upsert local).
   */
  static async setSetting(
    farmId: string,
    key: string,
    value: string
  ): Promise<void> {
    const res = await getSettingsUseCases().updateUseCase.execute(farmId, key, value);
    if (!res.ok) {
      throw new Error(res.error.message);
    }
  }

  /**
   * Retorna todos os parâmetros ativos da fazenda como um dicionário chave-valor.
   */
  static async getAllSettings(farmId: string): Promise<Record<string, string>> {
    return await getSettingsUseCases().repo.getAll(farmId);
  }
}
