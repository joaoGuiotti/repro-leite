import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Baby, PlusCircle, Share2 } from 'lucide-react-native';
import { Botao, Cartao } from '@/ui';

export function QuickActionsCard() {
  const router = useRouter();

  return (
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
  );
}
