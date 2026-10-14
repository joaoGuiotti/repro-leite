import { i18n } from '@/i18n';
import {
  AppIcons,
  Botao,
  CampoTexto,
  Cartao,
  EmptyState,
  hapticFeedback,
  Icon,
  ListLoadingState,
  SeloStatus,
} from '@/ui';
import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ListAnimalsUseCase } from '../../application/list-animals.usecase';
import { RegisterAnimalUseCase } from '../../application/register-animal.usecase';
import { RemoveAnimalUseCase } from '../../application/remove-animal.usecase';
import { AnimalRecord } from '../../domain/animal.entity';
import { BadgeBrinco } from '../components/BadgeBrinco';
import { ModalCadastroAnimal } from '../components/ModalCadastroAnimal';
import { ModalSaidaAnimal } from '../components/ModalSaidaAnimal';
import { useAnimals } from '../hooks/useAnimals';
import { useRegisterAnimal } from '../hooks/useRegisterAnimal';
import { useRemoveAnimal } from '../hooks/useRemoveAnimal';

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
      await hapticFeedback.success();
      setModalNovoAnimal(false);
      refresh();
      Alert.alert('Sucesso', `Animal #${dados.earTag} cadastrado no rebanho!`);
    } else {
      await hapticFeedback.error();
    }
  };

  const handleConfirmarSaida = async (dados: any) => {
    const atualizado = await registerExit(dados);
    if (atualizado) {
      await hapticFeedback.success();
      setAnimalSelecionadoParaSaida(null);
      refresh();
      Alert.alert('Sucesso', 'Saída do animal registrada com sucesso.');
    } else {
      await hapticFeedback.error();
    }
  };

  const handleReativarAnimal = useCallback(
    async (animal: AnimalRecord) => {
      const atualizado = await reactivateAnimal(animal.id);
      if (atualizado) {
        await hapticFeedback.success();
        refresh();
        Alert.alert('Sucesso', `Animal #${animal.earTag} reativado no rebanho!`);
      } else {
        await hapticFeedback.error();
        Alert.alert(
          'Não foi possível reativar',
          'Verifique se o brinco já não foi ocupado por outro animal ativo.'
        );
      }
    },
    [reactivateAnimal, refresh]
  );

  const handleSelectFilter = async (id: 'todas' | 'vazia' | 'inseminada' | 'prenhe' | 'seca') => {
    await hapticFeedback.selection();
    setFiltroRepro(id);
  };

  const handleToggleInactive = async () => {
    await hapticFeedback.selection();
    setMostrarInativos((prev) => !prev);
  };

  const renderHeader = useMemo(() => {
    return (
      <View className="gap-4 pb-3">
        {/* Ação Primária: Cadastrar Novo Animal */}
        <Botao
          titulo={i18n.herd.registerAnimal}
          onPress={() => {
            void hapticFeedback.selection();
            setModalNovoAnimal(true);
          }}
          variante="primario"
          icone={<Icon icon={AppIcons.add} size="sm" className="text-white" decorative />}
          principal
        />

        {/* Resumo Reprodutivo do Rebanho */}
        <Cartao titulo="Quadro Reprodutivo Ativo">
          <View className="flex-row flex-wrap gap-2 pt-1">
            <View className="flex-1 min-w-[130px] rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 p-3">
              <SeloStatus status="vazia" texto={i18n.herd.statuses.vazia} />
              <Text className="mt-2 text-2xl font-black text-gray-900 dark:text-gray-100">{summary.vazias}</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">Aguardando cobertura</Text>
            </View>

            <View className="flex-1 min-w-[130px] rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-3">
              <SeloStatus status="inseminada" texto={i18n.herd.statuses.inseminada} />
              <Text className="mt-2 text-2xl font-black text-blue-900 dark:text-blue-200">{summary.inseminadas}</Text>
              <Text className="text-xs text-blue-600 dark:text-blue-400">Vigiar cio (21d)</Text>
            </View>

            <View className="flex-1 min-w-[130px] rounded-xl bg-pasto-50 dark:bg-pasto-950/40 border border-pasto-200 dark:border-pasto-800/60 p-3">
              <SeloStatus status="prenhe" texto={i18n.herd.statuses.prenhe} />
              <Text className="mt-2 text-2xl font-black text-pasto-900 dark:text-pasto-200">{summary.prenhes}</Text>
              <Text className="text-xs text-pasto-700 dark:text-pasto-400">Confirmadas no toque</Text>
            </View>

            <View className="flex-1 min-w-[130px] rounded-xl bg-terra-50 dark:bg-amber-950/30 border border-terra-200 dark:border-amber-900/50 p-3">
              <SeloStatus status="secada" texto={i18n.herd.statuses.secada} />
              <Text className="mt-2 text-2xl font-black text-terra-700 dark:text-amber-300">{summary.secas}</Text>
              <Text className="text-xs text-terra-500 dark:text-amber-400/80">Próximas ao parto</Text>
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
            iconeEsquerda={<Icon icon={AppIcons.search} size="sm" className="text-gray-400" decorative />}
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
                onPress={() => handleSelectFilter(f.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: filtroRepro === f.id }}
                className={`py-1 px-2 rounded-full border ${filtroRepro === f.id
                  ? 'bg-pasto-700 border-pasto-900'
                  : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700'
                  }`}
              >
                <Text
                  className={`text-xs font-bold ${filtroRepro === f.id ? 'text-white' : 'text-gray-700 dark:text-gray-200'
                    }`}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Alternador de Inativos */}
          <TouchableOpacity
            onPress={handleToggleInactive}
            accessibilityRole="switch"
            accessibilityState={{ checked: mostrarInativos }}
            className="mt-3 min-h-[48px] flex-row items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-2.5"
          >
            <Text className="text-xs text-gray-600 dark:text-gray-300">Exibir animais inativos (com saída lançada)</Text>
            <Text className={`text-xs font-bold ${mostrarInativos ? 'text-amber-800 dark:text-amber-400' : 'text-gray-400'}`}>
              {mostrarInativos ? 'Ativado' : 'Oculto'}
            </Text>
          </TouchableOpacity>
        </Cartao>

        {/* Contador da listagem */}
        <View className="flex-row items-center justify-between px-1 pt-1">
          <Text className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Animais Encontrados ({animals.length})
          </Text>
        </View>
      </View>
    );
  }, [busca, filtroRepro, mostrarInativos, summary, animals.length]);

  const renderItem = useCallback(
    ({ item: animal }: { item: AnimalRecord }) => {
      const inativo = animal.exitStatus !== 'ativo';

      return (
        <View
          key={animal.id}
          className={`rounded-2xl border p-4 shadow-xs mb-3 ${inativo
            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
            : 'bg-surface dark:bg-surface-dark border-gray-200 dark:border-slate-800'
            }`}
        >
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-row items-center gap-3 flex-1">
              <BadgeBrinco
                numero={animal.earTag}
                variante={inativo ? 'inativo' : 'padrao'}
              />

              <View className="flex-1">
                <Text className="text-lg font-black text-gray-950 dark:text-gray-100" numberOfLines={1}>
                  {animal.name || `Animal #${animal.earTag}`}
                </Text>

                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Raça: <Text className="font-semibold text-gray-800 dark:text-gray-200">{animal.breed}</Text>
                  {animal.sex === 'macho' ? ' · Macho' : ''}
                </Text>
              </View>
            </View>

            <View className="items-end gap-1">
              {inativo ? (
                <View className="rounded-lg bg-amber-200 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5">
                  <Text className="text-xs font-bold text-amber-900 dark:text-amber-200 capitalize">
                    {animal.exitStatus} ({animal.exitDate ? animal.exitDate.slice(0, 4) : ''})
                  </Text>
                </View>
              ) : animal.sex === 'femea' ? (
                <SeloStatus
                  status={animal.reproStatus as any}
                  texto={animal.reproStatus.toUpperCase()}
                />
              ) : (
                <View className="rounded-lg bg-gray-200 dark:bg-slate-700 px-2 py-0.5">
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-200">MACHO</Text>
                </View>
              )}
            </View>
          </View>

          {/* Botões de Ação na Ficha usando componente Botao do Design System */}
          <View className="mt-3.5 flex-row items-center justify-end gap-2 border-t border-gray-100 dark:border-slate-800 pt-2.5">
            {inativo ? (
              <Botao
                titulo="Reativar Animal"
                onPress={() => handleReativarAnimal(animal)}
                variante="secundario"
                tamanho="sm"
                icone={<Icon icon={AppIcons.sync} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
                accessibilityLabel={`Reativar animal #${animal.earTag}`}
              />
            ) : (
              <>
                {animal.sex === 'femea' && onInseminateAnimal && (
                  <Botao
                    titulo="Inseminar"
                    onPress={() => {
                      void hapticFeedback.selection();
                      onInseminateAnimal(animal);
                    }}
                    variante="secundario"
                    tamanho="sm"
                    icone={<Icon icon={AppIcons.insemination} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
                    accessibilityLabel={`Inseminar animal #${animal.earTag}`}
                  />
                )}
                <Botao
                  titulo="Registrar Saída"
                  onPress={() => {
                    void hapticFeedback.selection();
                    setAnimalSelecionadoParaSaida(animal);
                  }}
                  variante="contorno"
                  tamanho="sm"
                  icone={<Icon icon={AppIcons.close} size="sm" className="text-gray-600 dark:text-gray-300" decorative />}
                  accessibilityLabel={`Registrar saída do animal #${animal.earTag}`}
                />
              </>
            )}
          </View>
        </View>
      );
    },
    [handleReativarAnimal, onInseminateAnimal]
  );

  return (
    <View className="flex-1">
      <FlashList
        data={animals}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <ListLoadingState count={3} />
          ) : (
            <EmptyState
              icon={AppIcons.search}
              title={i18n.herd.emptyHerd}
              description={
                busca
                  ? 'Nenhum animal coincide com os termos digitados.'
                  : 'Nenhum animal cadastrado no filtro selecionado.'
              }
              actionLabel={busca ? 'Limpar busca' : i18n.herd.registerAnimal}
              onAction={() => {
                if (busca) {
                  setBusca('');
                } else {
                  setModalNovoAnimal(true);
                }
              }}
            />
          )
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      />

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
