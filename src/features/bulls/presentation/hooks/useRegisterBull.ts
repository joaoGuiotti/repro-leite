import { useState } from 'react';
import { AppError } from '@core/result';
import { BullRecord, CreateBullDTO } from '../../domain/bull.entity';
import { RegisterBullUseCase } from '../../application/register-bull.usecase';

export function useRegisterBull(registerUseCase: RegisterBullUseCase) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const registerBull = async (dto: CreateBullDTO): Promise<BullRecord | null> => {
    setLoading(true);
    setError(null);
    const result = await registerUseCase.execute(dto);
    setLoading(false);
    if (result.ok) {
      return result.value;
    } else {
      setError(result.error);
      return null;
    }
  };

  return {
    registerBull,
    loading,
    error,
  };
}
