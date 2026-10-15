import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_FARM_PARAMETERS, FarmParameters } from '../../domain/setting.entity';
import { GetSettingsUseCase } from '../../application/get-settings.usecase';
import { UpdateSettingUseCase } from '../../application/update-setting.usecase';

export function useSettings(
  farmId: string,
  getUseCase: GetSettingsUseCase,
  updateUseCase: UpdateSettingUseCase
) {
  const [parameters, setParameters] = useState<FarmParameters>(DEFAULT_FARM_PARAMETERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUseCase.execute(farmId);
      if (res.ok) {
        setParameters(res.value);
      } else {
        setError(res.error.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar parâmetros';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [farmId, getUseCase]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const res = await getUseCase.execute(farmId);
        if (ativo) {
          if (res.ok) {
            setParameters(res.value);
          } else {
            setError(res.error.message);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (ativo) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar parâmetros';
          setError(msg);
          setLoading(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [farmId, getUseCase]);

  const updateParameter = async (key: string, value: string): Promise<boolean> => {
    const res = await updateUseCase.execute(farmId, key, value);
    if (res.ok) {
      await refresh();
      return true;
    }
    return false;
  };

  const saveParameters = async (newParams: FarmParameters): Promise<boolean> => {
    try {
      const updates = [
        updateUseCase.execute(farmId, 'heat_window_days', String(newParams.heatWindowDays)),
        updateUseCase.execute(farmId, 'pregnancy_check_days', String(newParams.pregnancyCheckDays)),
        updateUseCase.execute(farmId, 'gestation_days', String(newParams.gestationDays)),
        updateUseCase.execute(farmId, 'dry_off_days', String(newParams.dryOffDays)),
        updateUseCase.execute(farmId, 'heifer_breeding_weight_kg', String(newParams.heiferBreedingWeightKg)),
      ];

      const results = await Promise.all(updates);
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        await refresh();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return {
    parameters,
    loading,
    error,
    refresh,
    updateParameter,
    saveParameters,
  };
}
