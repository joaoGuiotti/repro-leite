import { useState } from 'react';
import { AppError } from '@core/result';
import {
  CreateInseminationDTO,
  InseminationRecord,
} from '../../domain/insemination.entity';
import { RegisterInseminationUseCase } from '../../application/register-insemination.usecase';

export function useRegisterInsemination(
  registerUseCase: RegisterInseminationUseCase
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const registerInsemination = async (
    farmId: string,
    dto: CreateInseminationDTO
  ): Promise<InseminationRecord | null> => {
    setLoading(true);
    setError(null);
    const result = await registerUseCase.execute(farmId, dto);
    setLoading(false);
    if (result.ok) {
      return result.value;
    } else {
      setError(result.error);
      return null;
    }
  };

  return {
    registerInsemination,
    loading,
    error,
  };
}
