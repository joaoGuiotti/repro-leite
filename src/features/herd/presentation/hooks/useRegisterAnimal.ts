import { useState } from 'react';
import { AppError } from '@core/result';
import { AnimalRecord, CreateAnimalDTO } from '../../domain/animal.entity';
import { RegisterAnimalUseCase } from '../../application/register-animal.usecase';

export function useRegisterAnimal(registerUseCase: RegisterAnimalUseCase) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const registerAnimal = async (dto: CreateAnimalDTO): Promise<AnimalRecord | null> => {
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
    registerAnimal,
    loading,
    error,
  };
}
