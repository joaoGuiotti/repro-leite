import { useState } from 'react';
import { AppError } from '@core/result';
import { DeleteInseminationUseCase } from '../../application/delete-insemination.usecase';

export function useDeleteInsemination(deleteUseCase: DeleteInseminationUseCase) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const deleteInsemination = async (
    inseminationId: string,
    options: { restoreStrawStock: boolean } = { restoreStrawStock: true }
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const result = await deleteUseCase.execute(inseminationId, options);
    setLoading(false);
    if (result.ok) {
      return true;
    } else {
      setError(result.error);
      return false;
    }
  };

  return {
    deleteInsemination,
    loading,
    error,
  };
}
