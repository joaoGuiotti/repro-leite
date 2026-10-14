import { useState } from 'react';
import { AppError } from '@core/result';
import { AnimalRecord, RegisterExitDTO } from '../../domain/animal.entity';
import { RemoveAnimalUseCase } from '../../application/remove-animal.usecase';

export function useRemoveAnimal(removeUseCase: RemoveAnimalUseCase) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const registerExit = async (dto: RegisterExitDTO): Promise<AnimalRecord | null> => {
    setLoading(true);
    setError(null);
    const result = await removeUseCase.registerExit(dto);
    setLoading(false);
    if (result.ok) {
      return result.value;
    } else {
      setError(result.error);
      return null;
    }
  };

  const softDelete = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const result = await removeUseCase.softDelete(id);
    setLoading(false);
    if (result.ok) {
      return true;
    } else {
      setError(result.error);
      return false;
    }
  };

  const reactivateAnimal = async (id: string): Promise<AnimalRecord | null> => {
    setLoading(true);
    setError(null);
    const result = await removeUseCase.reactivate(id);
    setLoading(false);
    if (result.ok) {
      return result.value;
    } else {
      setError(result.error);
      return null;
    }
  };

  return {
    registerExit,
    reactivateAnimal,
    softDelete,
    loading,
    error,
  };
}
