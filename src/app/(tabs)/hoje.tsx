import { useManagementDate, formatToDisplay } from '@core/simulation';
import { Botao, Cartao, SeloStatus } from '@/ui';
import { useRouter } from 'expo-router';
import { Baby, PlusCircle, Share2 } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';

export default function TelaHoje() {
  const router = useRouter();
  const { activeDateString, isSimulated } = useManagementDate();

  return (
    <ScrollView className="flex-1 bg-pasto-50" contentContainerClassName="gap-4 p-4 pb-12">
      {/* Card de Boas-Vindas e Resumo do Dia */}
      <Cartao titulo="Hoje no Curral">
        <View className="flex-row items-center justify-between pb-2">
          <Text className="text-sm text-gray-600">
            Manejo ativo para: <Text className="font-bold text-pasto-900">{formatToDisplay(activeDateString)}</Text>
          </Text>
          {isSimulated ? (
            <SeloStatus status="aviso" texto="Data Simulada" />
          ) : (
            <SeloStatus status="prenhe" texto="Data Real" />
          )}
        </View>

        <Text className="text-base text-gray-700">
          Bem-vindo ao ReproLeite. O aplicativo está operando 100% offline em Modo Curral com o SQLite local protegido.
        </Text>
      </Cartao>

      {/* Ações Rápidas no Curral */}
      <Cartao titulo="Ações Rápidas">
        <View className="gap-2.5">
          <Botao
            titulo="Lançar Inseminação"
            icone={<PlusCircle size={20} color="#ffffff" />}
            onPress={() => router.push('/(tabs)/reproducao')}
            variante="primario"
            principal
          />
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Botao
                titulo="Cadastrar Bezerra"
                icone={<Baby size={18} color="#1b4332" />}
                onPress={() => router.push('/(tabs)/bezerras')}
                variante="secundario"
              />
            </View>
            <View className="flex-1">
              <Botao
                titulo="Backup / WhatsApp"
                icone={<Share2 size={18} color="#8a5a00" />}
                onPress={() => router.push('/(tabs)/ajustes')}
                variante="aviso"
              />
            </View>
          </View>
        </View>
      </Cartao>

      {/* Seção Próximas Ações do Dia */}
      <Cartao titulo="Painel Diário">
        <View className="gap-3">
          <View className="flex-row items-center justify-between rounded-xl bg-pasto-100 p-3.5">
            <View>
              <Text className="text-xs uppercase font-bold text-pasto-700">Cios para Vigiar (21d)</Text>
              <Text className="text-lg font-extrabold text-pasto-900">0 vacas</Text>
            </View>
            <SeloStatus status="vazia" texto="Nenhum alerta" />
          </View>

          <View className="flex-row items-center justify-between rounded-xl bg-ambar-100 p-3.5">
            <View>
              <Text className="text-xs uppercase font-bold text-ambar-700">Toques Veterinários (45d)</Text>
              <Text className="text-lg font-extrabold text-amber-900">0 vacas</Text>
            </View>
            <SeloStatus status="aviso" texto="Em dia" />
          </View>

          <View className="flex-row items-center justify-between rounded-xl bg-white p-3.5 border border-gray-200">
            <View>
              <Text className="text-xs uppercase font-bold text-gray-500">Trato do Bezerreiro</Text>
              <Text className="text-lg font-extrabold text-pasto-900">0 L Manhã · 0 L Tarde</Text>
            </View>
            <SeloStatus status="secada" texto="0 bezerras" />
          </View>
        </View>
      </Cartao>
    </ScrollView>
  );
}
