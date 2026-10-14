import { useState } from 'react';
import { AppError } from '@core/result';
import { CompleteAlertUseCase } from '../../application/complete-alert.usecase';

export function useCompleteAlert(completeUseCase: CompleteAlertUseCase) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const completeAlert = async (alertId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const result = await completeUseCase.execute(alertId);
    setLoading(false);
    if (result.ok) {
      return true;
    } else {
      setError(result.error);
      return false;
    }
  };

  return {
    completeAlert,
    loading,
    error,
  };
}
