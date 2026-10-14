import { useState } from 'react';
import { AppError } from '@core/result';
import { BullRecord } from '../../domain/bull.entity';
import { AdjustBullStrawsUseCase } from '../../application/adjust-bull-straws.usecase';

export function useAdjustStraws(adjustUseCase: AdjustBullStrawsUseCase) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const adjustStraws = async (bullId: string, delta: number): Promise<BullRecord | null> => {
    setLoading(true);
    setError(null);
    const result = await adjustUseCase.execute({ bullId, delta });
    setLoading(false);
    if (result.ok) {
      return result.value;
    } else {
      setError(result.error);
      return null;
    }
  };

  const softDelete = async (bullId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const result = await adjustUseCase.softDelete(bullId);
    setLoading(false);
    if (result.ok) {
      return true;
    } else {
      setError(result.error);
      return false;
    }
  };

  return {
    adjustStraws,
    softDelete,
    loading,
    error,
  };
}
