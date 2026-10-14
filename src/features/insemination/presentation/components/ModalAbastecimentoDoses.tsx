import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { PlusCircle } from 'lucide-react-native';
import { Botao, CampoNumerico, ModalPadrao } from '@/ui';
import { BullRecord, getBullsUseCases } from '@features/bulls';

export interface ModalAbastecimentoDosesProps {
  visivel: boolean;
  onFechar: () => void;
  touro: BullRecord | null;
  onAbastecido: (touroAtualizado: BullRecord) => void;
}

export function ModalAbastecimentoDoses({
  visivel,
  onFechar,
  touro,
  onAbastecido,
}: ModalAbastecimentoDosesProps) {
  const [dosesAdicionar, setDosesAdicionar] = useState('10');
  const [salvando, setSalvando] = useState(false);

  if (!touro) return null;

  const handleSalvar = async () => {
    const qtd = parseInt(dosesAdicionar, 10);
    if (isNaN(qtd) || qtd <= 0) {
      Alert.alert('Valor Inválido', 'Informe uma quantidade de doses maior que zero.');
      return;
    }

    try {
      setSalvando(true);
      const result = await getBullsUseCases().adjustUseCase.execute({
        bullId: touro.id,
        delta: qtd,
      });

      if (result.ok) {
        onAbastecido(result.value);
        onFechar();
      } else {
        Alert.alert('Erro ao Abastecer', result.error.message);
      }
    } catch {
      Alert.alert('Erro ao Abastecer', 'Não foi possível atualizar o saldo de doses.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalPadrao
      visivel={visivel}
      onFechar={onFechar}
      titulo="Abastecer Doses de Sêmen"
      subtitulo={`Touro: ${touro.name} (${touro.breed})`}
      iconeTitulo={<PlusCircle size={24} color="#1b4332" />}
      larguraMaxima="max-w-md"
      rodape={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Botao
              titulo="Cancelar"
              variante="secundario"
              onPress={onFechar}
            />
          </View>
          <View className="flex-1">
            <Botao
              titulo={salvando ? 'Salvando...' : 'Confirmar'}
              variante="primario"
              principal
              desabilitado={salvando}
              onPress={handleSalvar}
            />
          </View>
        </View>
      }
    >
      <View className="py-2">
        <Text className="text-sm text-gray-600 mb-4 leading-5">
          Informe a quantidade de novas palhetas recebidas no botijão para este reprodutor. O saldo atual é de{' '}
          <Text className="font-bold text-gray-900">{touro.strawsInStock} doses</Text>.
        </Text>

        <CampoNumerico
          rotulo="Quantidade de Doses a Adicionar"
          valor={dosesAdicionar}
          onChange={setDosesAdicionar}
          sufixo="doses"
          placeholder="Ex: 10"
        />
      </View>
    </ModalPadrao>
  );
}
