import { ScrollView, Text } from 'react-native';
import { Cartao } from '../../../components/ui/Cartao';

export default function Tela() {
  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
      <Cartao titulo="Bezerras">
        <Text className="text-base text-black">Fichas, genealogia, plano de leite e pesagens.</Text>
      </Cartao>
    </ScrollView>
  );
}
