import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DoorOpen, Plus, RotateCcw, Search, Sparkles } from 'lucide-react-native';
import { Botao, CampoTexto, Cartao, SeloStatus } from '@/ui';
import { AnimalRecord } from '../../domain/animal.entity';
import { BadgeBrinco } from '../components/BadgeBrinco';
import { ModalCadastroAnimal } from '../components/ModalCadastroAnimal';
import { ModalSaidaAnimal } from '../components/ModalSaidaAnimal';
import { useAnimals } from '../hooks/useAnimals';
import { useRegisterAnimal } from '../hooks/useRegisterAnimal';
import { useRemoveAnimal } from '../hooks/useRemoveAnimal';
import { ListAnimalsUseCase } from '../../application/list-animals.usecase';
import { RegisterAnimalUseCase } from '../../application/register-animal.usecase';
import { RemoveAnimalUseCase } from '../../application/remove-animal.usecase';

export interface HerdScreenProps {
  farmId: string;
  listUseCase: ListAnimalsUseCase;
  registerUseCase: RegisterAnimalUseCase;
  removeUseCase: RemoveAnimalUseCase;
  onInseminateAnimal?: (animal: AnimalRecord) => void;
  onCountChange?: (totalActive: number) => void;
}

export function HerdScreen({
  farmId,
  listUseCase,
  registerUseCase,
  removeUseCase,
  onInseminateAnimal,
  onCountChange,
}: HerdScreenProps) {
  // Filtros locais
  const [busca, setBusca] = useState('');
  const [filtroRepro, setFiltroRepro] = useState<
    'todas' | 'vazia' | 'inseminada' | 'prenhe' | 'seca'
  >('todas');
  const [mostrarInativos, setMostrarInativos] = useState(false);

  // Modais
  const [modalNovoAnimal, setModalNovoAnimal] = useState(false);
  const [animalSelecionadoParaSaida, setAnimalSelecionadoParaSaida] =
    useState<AnimalRecord | null>(null);

  // Hooks de use case
  const { animals, allAnimals, summary, loading, refresh } = useAnimals(
    farmId,
    listUseCase,
    {
      query: busca,
      reproStatus: filtroRepro,
      showInactive: mostrarInativos,
    }
  );

  const { registerAnimal } = useRegisterAnimal(registerUseCase);
  const { registerExit, reactivateAnimal } = useRemoveAnimal(removeUseCase);

  useEffect(() => {
    onCountChange?.(summary.total);
  }, [summary.total, onCountChange]);

  const handleSalvarNovoAnimal = async (dados: any) => {
    const criado = await registerAnimal({
      ...dados,
      farmId,
    });
    if (criado) {
      setModalNovoAnimal(false);
      refresh();
      Alert.alert('Sucesso', `Animal #${dados.earTag} cadastrado no rebanho!`);
    }
  };

  const handleConfirmarSaida = async (dados: any) => {
    const atualizado = await registerExit(dados);
    if (atualizado) {
      setAnimalSelecionadoParaSaida(null);
      refresh();
      Alert.alert('Sucesso', 'Saída do animal registrada com sucesso.');
    }
  };

  const handleReativarAnimal = async (animal: AnimalRecord) => {
    const atualizado = await reactivateAnimal(animal.id);
    if (atualizado) {
      refresh();
      Alert.alert('Sucesso', `Animal #${animal.earTag} reativado no rebanho!`);
    } else {
      Alert.alert(
        'Não foi possível reativar',
        'Verifique se o brinco já não foi ocupado por outro animal ativo.'
      );
    }
  };

  return (
    <View className="gap-4">
      {/* Ação Primária: Cadastrar Novo Animal */}
      <Botao
        titulo="Cadastrar Novo Animal"
        onPress={() => setModalNovoAnimal(true)}
        variante="primario"
        icone={<Plus size={18} color="#ffffff" />}
        principal
      />

      {/* Resumo Reprodutivo do Rebanho */}
      <Cartao titulo="Quadro Reprodutivo Ativo">
        <View className="flex-row flex-wrap gap-2 pt-1">
          <View className="flex-1 min-w-[130px] rounded-xl bg-gray-50 border border-gray-200 p-3">
            <SeloStatus status="vazia" texto="Vazias" />
            <Text className="mt-2 text-2xl font-black text-gray-900">{summary.vazias}</Text>
            <Text className="text-xs text-gray-500">Aguardando cobertura</Text>
          </View>

          <View className="flex-1 min-w-[130px] rounded-xl bg-blue-50 border border-blue-200 p-3">
            <SeloStatus status="inseminada" texto="Inseminadas" />
            <Text className="mt-2 text-2xl font-black text-blue-900">{summary.inseminadas}</Text>
            <Text className="text-xs text-blue-600">Vigiar cio (21d)</Text>
          </View>

          <View className="flex-1 min-w-[130px] rounded-xl bg-pasto-50 border border-pasto-200 p-3">
            <SeloStatus status="prenhe" texto="Prenhes" />
            <Text className="mt-2 text-2xl font-black text-pasto-900">{summary.prenhes}</Text>
            <Text className="text-xs text-pasto-700">Confirmadas no toque</Text>
          </View>

          <View className="flex-1 min-w-[130px] rounded-xl bg-terra-50 border border-terra-200 p-3">
            <SeloStatus status="secada" texto="Secas" />
            <Text className="mt-2 text-2xl font-black text-terra-700">{summary.secas}</Text>
            <Text className="text-xs text-terra-500">Próximas ao parto</Text>
          </View>
        </View>
      </Cartao>

      {/* Barra de Busca & Filtros Rápidos */}
      <Cartao titulo="Buscar no Rebanho">
        <CampoTexto
          rotulo="Buscar por Brinco ou Nome"
          valor={busca}
          onChange={setBusca}
          placeholder="Digite o brinco (ex: 104) ou nome"
          iconeEsquerda={<Search size={18} color="#6b7280" />}
          limpavel
        />

        <View className="mt-3 flex-row flex-wrap gap-1.5">
          {(
            [
              { id: 'todas', label: 'Todas' },
              { id: 'vazia', label: 'Vazias' },
              { id: 'inseminada', label: 'Inseminadas' },
              { id: 'prenhe', label: 'Prenhes' },
              { id: 'seca', label: 'Secas' },
            ] as const
          ).map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFiltroRepro(f.id)}
              className={`px-3 py-1.5 rounded-full border ${
                filtroRepro === f.id
                  ? 'bg-pasto-700 border-pasto-900'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  filtroRepro === f.id ? 'text-white' : 'text-gray-700'
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alternador de Inativos */}
        <TouchableOpacity
          onPress={() => setMostrarInativos(!mostrarInativos)}
          className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-2.5"
        >
          <Text className="text-xs text-gray-600">Exibir animais inativos (com saída lançada)</Text>
          <Text className={`text-xs font-bold ${mostrarInativos ? 'text-amber-800' : 'text-gray-400'}`}>
            {mostrarInativos ? 'Ativado' : 'Oculto'}
          </Text>
        </TouchableOpacity>
      </Cartao>

      {/* Listagem de Animais */}
      <View className="gap-2.5">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Animais Encontrados ({animals.length})
          </Text>
        </View>

        {loading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color="#1f4f3a" />
          </View>
        ) : animals.length === 0 ? (
          <Cartao>
            <View className="items-center py-6">
              <Search size={32} color="#9ca3af" className="mb-2" />
              <Text className="text-sm font-bold text-gray-700">Nenhum animal encontrado</Text>
              <Text className="text-xs text-gray-500 mt-1">
                Tente buscar por outro número de brinco ou alternar o filtro.
              </Text>
            </View>
          </Cartao>
        ) : (
          animals.map((animal) => {
            const inativo = animal.exitStatus !== 'ativo';

            return (
              <View
                key={animal.id}
                className={`rounded-2xl border p-4 shadow-sm ${
                  inativo ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-gray-200'
                }`}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <BadgeBrinco
                      numero={animal.earTag}
                      variante={inativo ? 'inativo' : 'padrao'}
                    />

                    <View className="flex-1">
                      <Text className="text-lg font-black text-gray-950" numberOfLines={1}>
                        {animal.name || `Animal #${animal.earTag}`}
                      </Text>

                      <Text className="text-xs text-gray-500 mt-0.5">
                        Raça: <Text className="font-semibold text-gray-800">{animal.breed}</Text>
                        {animal.sex === 'macho' ? ' · Macho' : ''}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end gap-1">
                    {inativo ? (
                      <View className="rounded-lg bg-amber-200 border border-amber-300 px-2 py-0.5">
                        <Text className="text-xs font-bold text-amber-900 capitalize">
                          {animal.exitStatus} ({animal.exitDate ? animal.exitDate.slice(0, 4) : ''})
                        </Text>
                      </View>
                    ) : animal.sex === 'femea' ? (
                      <SeloStatus
                        status={animal.reproStatus as any}
                        texto={animal.reproStatus.toUpperCase()}
                      />
                    ) : (
                      <View className="rounded-lg bg-gray-200 px-2 py-0.5">
                        <Text className="text-xs font-bold text-gray-700">MACHO</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Botões de Ação na Ficha */}
                <View className="mt-3.5 flex-row items-center justify-end gap-2 border-t border-gray-100 pt-2.5">
                  {inativo ? (
                    <TouchableOpacity
                      onPress={() => handleReativarAnimal(animal)}
                      className="flex-row items-center rounded-lg border border-pasto-600 bg-pasto-50 px-3 py-1.5"
                    >
                      <RotateCcw size={14} color="#1b4332" className="mr-1" />
                      <Text className="text-xs font-bold text-pasto-900">Reativar Animal</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      {animal.sex === 'femea' && onInseminateAnimal && (
                        <TouchableOpacity
                          onPress={() => onInseminateAnimal(animal)}
                          className="flex-row items-center rounded-lg border border-pasto-700 bg-pasto-100 px-3 py-1.5"
                        >
                          <Sparkles size={14} color="#1b4332" className="mr-1" />
                          <Text className="text-xs font-bold text-pasto-900">Inseminar</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => setAnimalSelecionadoParaSaida(animal)}
                        className="flex-row items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5"
                      >
                        <DoorOpen size={14} color="#6b7280" className="mr-1" />
                        <Text className="text-xs font-semibold text-gray-700">Registrar Saída</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Modais */}
      <ModalCadastroAnimal
        visivel={modalNovoAnimal}
        onFechar={() => setModalNovoAnimal(false)}
        onSalvar={handleSalvarNovoAnimal}
        animaisExistentes={allAnimals}
        farmId={farmId}
      />

      <ModalSaidaAnimal
        animal={animalSelecionadoParaSaida}
        visivel={!!animalSelecionadoParaSaida}
        onFechar={() => setAnimalSelecionadoParaSaida(null)}
        onConfirmarSaida={handleConfirmarSaida}
      />
    </View>
  );
}
