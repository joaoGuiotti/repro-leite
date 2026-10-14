import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Botao, CampoNumerico, ModalPadrao } from '@/ui';
import { CreateBullDTO } from '../../domain/bull.entity';

export interface ModalCadastroTouroProps {
  visivel: boolean;
  onFechar: () => void;
  onSalvar: (dados: CreateBullDTO) => Promise<void>;
  farmId: string;
}

const RACAS_SUGERIDAS = ['Gir Leiteiro', 'Holandesa', 'Girolando', 'Jersey', 'Pardo Suíço'];

export function ModalCadastroTouro({
  visivel,
  onFechar,
  onSalvar,
  farmId,
}: ModalCadastroTouroProps) {
  const [nome, setNome] = useState('');
  const [raca, setRaca] = useState('Gir Leiteiro');
  const [codigo, setCodigo] = useState('');
  const [doses, setDoses] = useState('10');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    if (!nome.trim() || !raca.trim()) return;

    try {
      setSalvando(true);
      await onSalvar({
        farmId,
        name: nome.trim(),
        breed: raca.trim(),
        code: codigo.trim() || undefined,
        strawsInStock: parseInt(doses, 10) || 0,
        notes: observacoes.trim() || undefined,
      });

      setNome('');
      setCodigo('');
      setDoses('10');
      setObservacoes('');
      onFechar();
    } catch (err) {
      console.error('Erro ao cadastrar touro:', err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalPadrao
      visivel={visivel}
      onFechar={onFechar}
      titulo="Cadastrar Novo Touro"
      subtitulo="Reprodutor e estoque de sêmen"
      rodape={
        <Botao
          titulo={salvando ? 'Salvando...' : 'Salvar Touro'}
          onPress={handleSalvar}
          variante="primario"
          principal
          desabilitado={salvando || !nome.trim() || !raca.trim()}
        />
      }
    >
      <ScrollView contentContainerClassName="p-4 gap-4 pb-8">
        <View className="mb-3">
          <Text className="mb-1 text-sm font-semibold text-gray-700">Nome do Touro *</Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Jaguar TE"
            className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900"
          />
        </View>

        <View className="mb-3">
          <Text className="mb-1 text-sm font-semibold text-gray-700">Raça *</Text>
          <View className="flex-row flex-wrap gap-1.5 mb-2">
            {RACAS_SUGERIDAS.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRaca(r)}
                className={`px-3 py-1.5 rounded-xl border ${
                  raca === r
                    ? 'bg-pasto-100 border-pasto-700'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    raca === r ? 'text-pasto-900' : 'text-gray-700'
                  }`}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={raca}
            onChangeText={setRaca}
            placeholder="Digite ou selecione a raça"
            className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900"
          />
        </View>

        <View className="mb-3">
          <Text className="mb-1 text-sm font-semibold text-gray-700">
            Código da Palheta / Registro (Opcional)
          </Text>
          <TextInput
            value={codigo}
            onChangeText={setCodigo}
            placeholder="Ex: GIR-8821"
            className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900"
          />
        </View>

        <CampoNumerico
          rotulo="Doses Iniciais em Estoque"
          valor={doses}
          onChange={setDoses}
          placeholder="10"
          sufixo="doses"
        />

        <View className="mt-3">
          <Text className="mb-1 text-sm font-semibold text-gray-700">
            Observações / Linhagem (Opcional)
          </Text>
          <TextInput
            value={observacoes}
            onChangeText={setObservacoes}
            placeholder="Ex: Touro provado para leite, recomendado para novilhas"
            className="h-16 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
            multiline
          />
        </View>
      </ScrollView>
    </ModalPadrao>
  );
}
