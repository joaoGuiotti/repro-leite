import { Botao, Cartao, Icon } from '@/ui';
import { useRouter } from 'expo-router';
import { Baby, PlusCircle, Share2 } from 'lucide-react-native';
import { View } from 'react-native';

export function QuickActionsCard() {
  const router = useRouter();

  return (
    <Cartao titulo="Ações Rápidas">
      <View className="gap-2.5">
        <Botao
          titulo="Lançar Inseminação"
          icone={<Icon icon={PlusCircle} size="md" className="text-white" decorative />}
          onPress={() => router.push('/(tabs)/reproducao')}
          variante="primario"
          principal
        />
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Botao
              titulo="Cadastrar Bezerra"
              icone={<Icon icon={Baby} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
              onPress={() => router.push('/(tabs)/bezerras')}
              variante="secundario"
            />
          </View>
          <View className="flex-1">
            <Botao
              titulo="Backup / WhatsApp"
              icone={<Icon icon={Share2} size="sm" className="text-amber-800 dark:text-amber-300" decorative />}
              onPress={() => router.push('/(tabs)/ajustes')}
              variante="aviso"
            />
          </View>
        </View>
      </View>
    </Cartao>
  );
}
