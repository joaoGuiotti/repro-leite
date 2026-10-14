import { BullRecord, CreateBullDTO } from '@/types/bull';
import { Botao, CampoNumerico, Cartao, ModalPadrao } from '@/ui';
import { Minus, Plus, ShieldAlert } from 'lucide-react-native';
import { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface CatalogoTourosProps {
  touros: BullRecord[];
  onCadastrarTouro: (dados: CreateBullDTO) => Promise<void>;
  onAjustarDoses: (touroId: string, delta: number) => Promise<void>;
  farmId: string;
}

export function CatalogoTouros({
  touros,
  onCadastrarTouro,
  onAjustarDoses,
  farmId,
}: CatalogoTourosProps) {
  const [modalAberto, setModalAberto] = useState(false);
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
      await onCadastrarTouro({
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
      setModalAberto(false);
    } catch (err) {
      console.error('Erro ao cadastrar touro:', err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View className="flex-1">
      {/* Botão de Ação Primária */}
      <View className="mb-4">
        <Botao
          titulo="Cadastrar Novo Touro"
          onPress={() => setModalAberto(true)}
          variante="primario"
          principal
        />
      </View>

      {/* Lista de Touros */}
      {touros.length === 0 ? (
        <Cartao>
          <View className="items-center py-6">
            <ShieldAlert size={36} color="#9ca3af" className="mb-2" />
            <Text className="text-base font-bold text-gray-800">Nenhum touro cadastrado</Text>
            <Text className="mt-1 text-center text-xs text-gray-500">
              Cadastre reprodutores e controle o saldo de palhetas de sêmen disponíveis no botijão.
            </Text>
          </View>
        </Cartao>
      ) : (
        <View className="gap-3">
          {touros.map((touro) => {
            const semEstoque = touro.strawsInStock <= 0;

            return (
              <Cartao key={touro.id}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-black text-gray-950">{touro.name}</Text>
                    <Text className="text-xs text-gray-600">
                      Raça: <Text className="font-semibold text-gray-900">{touro.breed}</Text>
                      {touro.code ? ` · Palheta: ${touro.code}` : ''}
                    </Text>
                    {touro.notes ? (
                      <Text className="mt-1 text-xs italic text-gray-500">{touro.notes}</Text>
                    ) : null}
                  </View>

                  {/* Badge de Estoque */}
                  {semEstoque ? (
                    <View className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1">
                      <Text className="text-xs font-bold text-red-700">Estoque Zerado</Text>
                    </View>
                  ) : (
                    <View className="rounded-lg border border-pasto-300 bg-pasto-100 px-2.5 py-1">
                      <Text className="text-xs font-bold text-pasto-950">
                        {touro.strawsInStock} doses
                      </Text>
                    </View>
                  )}
                </View>

                {/* Controles de Ajuste Rápido de Doses */}
                <View className="mt-4 flex-row items-center justify-between border-t border-gray-100 pt-3">
                  <Text className="text-xs font-semibold text-gray-600">
                    Ajustar doses no botijão:
                  </Text>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => onAjustarDoses(touro.id, -1)}
                      disabled={semEstoque}
                      className={`h-9 w-9 items-center justify-center rounded-lg border ${semEstoque
                        ? 'border-gray-200 bg-gray-100 opacity-50'
                        : 'border-gray-300 bg-white active:bg-gray-100'
                        }`}
                    >
                      <Minus size={16} color="#374151" />
                    </TouchableOpacity>

                    <Text className="min-w-[28px] text-center text-base font-black text-gray-900">
                      {touro.strawsInStock}
                    </Text>

                    <TouchableOpacity
                      onPress={() => onAjustarDoses(touro.id, 1)}
                      className="h-9 w-9 items-center justify-center rounded-lg border border-pasto-700 bg-pasto-700 active:bg-pasto-700"
                    >
                      <Plus size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Cartao>
            );
          })}
        </View>
      )}

      {/* Modal de Cadastro de Touro */}
      <ModalPadrao
        visivel={modalAberto}
        onFechar={() => setModalAberto(false)}
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
            <TextInput
              value={raca}
              onChangeText={setRaca}
              placeholder="Ex: Gir Leiteiro, Holandês, Jersey"
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
    </View>
  );
}
