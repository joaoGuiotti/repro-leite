import { ModalCadastroAnimal } from '@/components/rebanho/ModalCadastroAnimal';
import { ModalSaidaAnimal } from '@/components/rebanho/ModalSaidaAnimal';
import { CatalogoTouros } from '@/components/touros/CatalogoTouros';
import { DEFAULT_FARM_ID } from '@/db/client';
import { AnimalRepository } from '@/db/repositories/animalRepository';
import { BullRepository } from '@/db/repositories/bullRepository';
import { filterAnimals } from '@/domain/animalFilters';
import { AnimalRecord, AnimalReproStatus } from '@/types/animal';
import { BullRecord, CreateBullDTO } from '@/types/bull';
import { Botao, CampoNumerico, Cartao, SeloStatus } from '@/ui';
import {
  DoorOpen,
  RotateCcw,
  Search,
  Shield,
  Users,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TelaReproducao() {
  const [secaoAtiva, setSecaoAtiva] = useState<'rebanho' | 'touros'>('rebanho');
  const [carregando, setCarregando] = useState(true);

  // Dados
  const [animais, setAnimais] = useState<AnimalRecord[]>([]);
  const [touros, setTouros] = useState<BullRecord[]>([]);

  // Filtros de rebanho
  const [buscaBrinco, setBuscaBrinco] = useState('');
  const [filtroRepro, setFiltroRepro] = useState<
    'todas' | 'vazia' | 'inseminada' | 'prenhe' | 'seca'
  >('todas');
  const [mostrarInativos, setMostrarInativos] = useState(false);

  // Modais
  const [modalNovoAnimal, setModalNovoAnimal] = useState(false);
  const [animalSelecionadoParaSaida, setAnimalSelecionadoParaSaida] =
    useState<AnimalRecord | null>(null);

  const recarregarDados = useCallback(async () => {
    try {
      const [listaAnimais, listaTouros] = await Promise.all([
        AnimalRepository.listByFarm(DEFAULT_FARM_ID, true),
        BullRepository.listByFarm(DEFAULT_FARM_ID),
      ]);
      setAnimais(listaAnimais);
      setTouros(listaTouros);
    } catch (err) {
      console.error('Erro ao recarregar dados do rebanho e touros:', err);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function buscarInicial() {
      try {
        const [listaAnimais, listaTouros] = await Promise.all([
          AnimalRepository.listByFarm(DEFAULT_FARM_ID, true),
          BullRepository.listByFarm(DEFAULT_FARM_ID),
        ]);
        if (ativo) {
          setAnimais(listaAnimais);
          setTouros(listaTouros);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do rebanho e touros:', err);
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    buscarInicial();

    return () => {
      ativo = false;
    };
  }, []);

  // Contadores de status (animais ativos e fêmeas)
  const contadores = useMemo(() => {
    const ativos = animais.filter((a) => a.exitStatus === 'ativo');
    return {
      total: ativos.length,
      vazias: ativos.filter((a) => a.sex === 'femea' && a.reproStatus === 'vazia').length,
      inseminadas: ativos.filter((a) => a.sex === 'femea' && a.reproStatus === 'inseminada').length,
      prenhes: ativos.filter((a) => a.sex === 'femea' && a.reproStatus === 'prenhe').length,
      secas: ativos.filter((a) => a.sex === 'femea' && a.reproStatus === 'seca').length,
    };
  }, [animais]);

  // Animais filtrados via motor puro de domínio
  const animaisFiltrados = useMemo(() => {
    return filterAnimals(animais, {
      query: buscaBrinco,
      reproStatus: filtroRepro,
      showInactive: mostrarInativos,
    });
  }, [animais, buscaBrinco, filtroRepro, mostrarInativos]);

  // Ações de animais
  const handleSalvarAnimal = async (dados: {
    earTag: string;
    name?: string;
    breed: string;
    sex: 'femea' | 'macho';
    birthDate: string;
    birthWeightKg: number;
    reproStatus?: AnimalReproStatus;
  }) => {
    await AnimalRepository.create({
      farmId: DEFAULT_FARM_ID,
      ...dados,
    });
    await recarregarDados();
  };

  const handleConfirmarSaida = async (dados: {
    animalId: string;
    exitStatus: 'vendido' | 'descartado' | 'morto';
    exitDate: string;
    exitReason?: string;
  }) => {
    await AnimalRepository.registerExit(dados);
    await recarregarDados();
  };

  const handleReativarAnimal = async (animal: AnimalRecord) => {
    try {
      await AnimalRepository.reactivate(animal.id);
      await recarregarDados();
    } catch {
      Alert.alert(
        'Não foi possível reativar',
        'Verifique se o brinco já não foi ocupado por outro animal ativo.'
      );
    }
  };

  // Ações de touros
  const handleCadastrarTouro = async (dados: CreateBullDTO) => {
    await BullRepository.create(dados);
    await recarregarDados();
  };

  const handleAjustarDoses = async (touroId: string, delta: number) => {
    try {
      await BullRepository.adjustStraws(touroId, delta);
      await recarregarDados();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao ajustar estoque';
      Alert.alert('Atenção', msg);
    }
  };

  return (
    <ScrollView className="flex-1 bg-pasto-50" contentContainerClassName="gap-4 p-4 pb-16">
      {/* Seletor Segmentado Superior: Rebanho vs Touros */}
      <View className="flex-row rounded-2xl bg-gray-200 p-1.5">
        <TouchableOpacity
          onPress={() => setSecaoAtiva('rebanho')}
          className={
            secaoAtiva === 'rebanho'
              ? 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-pasto-700'
              : 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-transparent'
          }
        >
          <Users size={18} color={secaoAtiva === 'rebanho' ? '#ffffff' : '#4b5563'} className="mr-2" />
          <Text
            className={
              secaoAtiva === 'rebanho'
                ? 'font-black text-sm text-white'
                : 'font-black text-sm text-gray-700'
            }
          >
            Rebanho ({contadores.total})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSecaoAtiva('touros')}
          className={
            secaoAtiva === 'touros'
              ? 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-pasto-700'
              : 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-transparent'
          }
        >
          <Shield size={18} color={secaoAtiva === 'touros' ? '#ffffff' : '#4b5563'} className="mr-2" />
          <Text
            className={
              secaoAtiva === 'touros'
                ? 'font-black text-sm text-white'
                : 'font-black text-sm text-gray-700'
            }
          >
            Touros ({touros.length})
          </Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <View className="py-12 items-center justify-center">
          <ActivityIndicator size="large" color="#1b4332" />
          <Text className="mt-3 text-sm text-gray-500 font-medium">Carregando dados locais...</Text>
        </View>
      ) : secaoAtiva === 'rebanho' ? (
        <>
          {/* Ação Primária: Novo Animal */}
          <Botao
            titulo="Cadastrar Novo Animal"
            onPress={() => setModalNovoAnimal(true)}
            variante="primario"
            principal
          />

          {/* Resumo Reprodutivo do Rebanho */}
          <Cartao titulo="Quadro Reprodutivo Ativo">
            <View className="flex-row flex-wrap gap-2 pt-1">
              <View className="flex-1 min-w-[130px] rounded-xl bg-gray-50 border border-gray-200 p-3">
                <SeloStatus status="vazia" texto="Vazias" />
                <Text className="mt-2 text-2xl font-black text-gray-900">{contadores.vazias}</Text>
                <Text className="text-xs text-gray-500">Aguardando cobertura</Text>
              </View>

              <View className="flex-1 min-w-[130px] rounded-xl bg-blue-50 border border-blue-200 p-3">
                <SeloStatus status="inseminada" texto="Inseminadas" />
                <Text className="mt-2 text-2xl font-black text-blue-900">{contadores.inseminadas}</Text>
                <Text className="text-xs text-blue-600">Vigiar cio (21d)</Text>
              </View>

              <View className="flex-1 min-w-[130px] rounded-xl bg-pasto-50 border border-pasto-200 p-3">
                <SeloStatus status="prenhe" texto="Prenhes" />
                <Text className="mt-2 text-2xl font-black text-pasto-900">{contadores.prenhes}</Text>
                <Text className="text-xs text-pasto-700">Confirmadas no toque</Text>
              </View>

              <View className="flex-1 min-w-[130px] rounded-xl bg-terra-50 border border-terra-200 p-3">
                <SeloStatus status="secada" texto="Secas" />
                <Text className="mt-2 text-2xl font-black text-terra-700">{contadores.secas}</Text>
                <Text className="text-xs text-terra-500">Próximas ao parto</Text>
              </View>
            </View>
          </Cartao>

          {/* Busca e Filtros */}
          <Cartao titulo="Buscar no Rebanho">
            <CampoNumerico
              rotulo="Buscar por Brinco ou Nome"
              valor={buscaBrinco}
              onChange={setBuscaBrinco}
              placeholder="Digite o brinco (ex: 104) ou nome"
            />

            {/* Pílulas de Filtro Reprodutivo */}
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
                  className={`px-3 py-1.5 rounded-full border ${filtroRepro === f.id
                      ? 'bg-pasto-700 border-pasto-900'
                      : 'bg-white border-gray-300'
                    }`}
                >
                  <Text
                    className={`text-xs font-bold ${filtroRepro === f.id ? 'text-white' : 'text-gray-700'
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
                Animais Encontrados ({animaisFiltrados.length})
              </Text>
            </View>

            {animaisFiltrados.length === 0 ? (
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
              animaisFiltrados.map((animal) => {
                const inativo = animal.exitStatus !== 'ativo';

                return (
                  <View
                    key={animal.id}
                    className={`rounded-2xl border p-4 shadow-sm ${inativo
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-white border-gray-200'
                      }`}
                  >
                    <View className="flex-row items-start justify-between">
                      {/* Identificação */}
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-2xl font-black text-gray-950">
                            #{animal.earTag}
                          </Text>
                          {animal.name ? (
                            <Text className="text-base font-bold text-gray-800">
                              {animal.name}
                            </Text>
                          ) : null}
                        </View>

                        <Text className="text-xs text-gray-500 mt-0.5">
                          Raça: <Text className="font-semibold text-gray-800">{animal.breed}</Text>
                          {animal.sex === 'macho' ? ' · Macho' : ''}
                        </Text>
                      </View>

                      {/* Selos de Status */}
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
                        <TouchableOpacity
                          onPress={() => setAnimalSelecionadoParaSaida(animal)}
                          className="flex-row items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5"
                        >
                          <DoorOpen size={14} color="#6b7280" className="mr-1" />
                          <Text className="text-xs font-semibold text-gray-700">Registrar Saída</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </>
      ) : (
        /* Seção: Catálogo de Touros e Estoque de Sêmen */
        <CatalogoTouros
          touros={touros}
          onCadastrarTouro={handleCadastrarTouro}
          onAjustarDoses={handleAjustarDoses}
          farmId={DEFAULT_FARM_ID}
        />
      )}

      {/* Modais */}
      <ModalCadastroAnimal
        visivel={modalNovoAnimal}
        onFechar={() => setModalNovoAnimal(false)}
        onSalvar={handleSalvarAnimal}
        animaisExistentes={animais}
        farmId={DEFAULT_FARM_ID}
      />

      <ModalSaidaAnimal
        animal={animalSelecionadoParaSaida}
        visivel={animalSelecionadoParaSaida !== null}
        onFechar={() => setAnimalSelecionadoParaSaida(null)}
        onConfirmarSaida={handleConfirmarSaida}
      />
    </ScrollView>
  );
}
