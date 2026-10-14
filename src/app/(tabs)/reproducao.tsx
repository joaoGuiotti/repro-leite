import { ReproductionScreen } from '@features/reproduction';
import { useLocalSearchParams } from 'expo-router';

export default function TelaReproducao() {
  const { action, animalId } = useLocalSearchParams<{
    action?: string;
    animalId?: string;
  }>();

  return (
    <ReproductionScreen
      initialTab={action === 'inseminate' ? 'inseminar' : undefined}
      preselectedAnimalId={animalId}
    />
  );
}

