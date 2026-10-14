import { ScrollView, Text } from 'react-native';
import { Cartao } from '../../../components/ui/Cartao';

export default function Tela() {
  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
      <Cartao titulo="Reprodução">
        <Text className="text-base text-black">Registrar IA, status do rebanho e catálogo de touros.</Text>
      </Cartao>
    </ScrollView>
  );
}
