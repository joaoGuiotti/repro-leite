import { ScrollView, Text } from 'react-native';
import { Cartao } from '../../components/ui/Cartao';

export default function Tela() {
  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
      <Cartao titulo="Ajustes e Backup">
        <Text className="text-base text-black">Conta, status de sincronização, exportação, raças e metas de peso.</Text>
      </Cartao>
    </ScrollView>
  );
}
