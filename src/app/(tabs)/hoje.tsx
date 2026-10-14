import { Cartao } from '@/components/ui';
import { ScrollView, Text } from 'react-native';

export default function Tela() {
  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
      <Cartao titulo="Hoje">
        <Text className="text-base text-black">Cios a vigiar, toques, partos, secagens, trocas de fase e litros do dia.</Text>
      </Cartao>
    </ScrollView>
  );
}
