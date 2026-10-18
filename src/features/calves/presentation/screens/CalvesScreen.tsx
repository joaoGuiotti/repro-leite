import {
  Botao,
  CampoTexto,
  EmptyState,
  ErrorState,
  Icon,
  ListLoadingState,
  Screen,
} from '@/ui';
import { useFarm } from '@core/farm';
import { useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Baby,
  Milk,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  RefreshControl,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { CalvesUseCases } from '../../factory';
import { AddWeighingModal } from '../components/AddWeighingModal';
import { CalfDetailPane } from '../components/CalfDetailPane';
import { CalfListCard } from '../components/CalfListCard';
import { RegisterCalfModal } from '../components/RegisterCalfModal';
import { useCalvesList } from '../hooks/useCalvesList';

export interface CalvesScreenProps {
  farmId?: string;
  useCases?: CalvesUseCases;
}

export function CalvesScreen({ farmId: propFarmId, useCases }: CalvesScreenProps) {
  const { farmId: contextFarmId } = useFarm();
  const farmId = propFarmId ?? contextFarmId;
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;

  const {
    calves,
    activeCalf,
    activeCalfId,
    loading,
    error,
    searchQuery,
    sexFilter,
    totalCalvesCount,
    totalHeifersCount,
    totalLitersToday,
    brincosExistentes,
    tourosDisponiveis,
    vacasDisponiveis,
    setSearchQuery,
    setSexFilter,
    setActiveCalfId,
    refresh,
    cadastrarBezerra,
    registrarPesagem,
    excluirBezerra,
  } = useCalvesList({ farmId, useCases });

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [modalPesagemAberto, setModalPesagemAberto] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const handleSelectCalf = (id: string) => {
    setActiveCalfId(id);
    if (!isTabletOrDesktop) {
      setMobileView('detail');
    }
  };

  const handleCadastrarNova = () => {
    setModalCadastroAberto(true);
  };

  const handleAdicionarPesagem = () => {
    setModalPesagemAberto(true);
  };

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
      contentContainerClassName="p-3 sm:p-4 gap-3 pb-12"
      testID="calves-screen"
    >
      {/* Cabeçalho Geral da Tela Fiel ao Mockup */}
      <View className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 shadow-2xs">
        <View className="flex-row items-center justify-between flex-wrap gap-3">
          {/* Título & Subtítulo */}
          <View className="flex-1 min-w-[260px]">
            <Text className="text-xl sm:text-2xl font-black text-gray-950 dark:text-gray-100">
              Manejo de Bezerras, Genealogia & Desmame
            </Text>
            <Text className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Acompanhamento individualizado desde o nascimento até a 1ª Inseminação
            </Text>
          </View>

          {/* Botão de Ação Primária de 56px */}
          <View className="w-full sm:w-auto">
            <Botao
              titulo="Cadastrar Nova Bezerra"
              principal
              variante="primario"
              icone={<Icon icon={Plus} size="md" className="text-white" decorative />}
              onPress={handleCadastrarNova}
            />
          </View>
        </View>

        {/* Resumo Métrico Global da Fazenda */}
        <View className="flex-row flex-wrap gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-slate-800">
          {/* Total de Leite Hoje */}
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pasto-50 dark:bg-pasto-950/60 border border-pasto-200 dark:border-pasto-800">
            <Icon icon={Milk} size="sm" className="text-pasto-700 dark:text-pasto-300" decorative />
            <Text className="text-xs font-bold text-pasto-900 dark:text-pasto-200">
              {totalLitersToday} Litros
            </Text>
            <Text className="text-[11px] text-pasto-700 dark:text-pasto-400">fornecidos hoje</Text>
          </View>

          {/* Bezerras em Aleitamento */}
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
            <Icon icon={Baby} size="sm" className="text-blue-700 dark:text-blue-300" decorative />
            <Text className="text-xs font-bold text-blue-900 dark:text-blue-200">
              {totalCalvesCount} Bezerras
            </Text>
            <Text className="text-[11px] text-blue-700 dark:text-blue-400">em aleitamento</Text>
          </View>

          {/* Novilhas em Recria */}
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800">
            <Icon icon={TrendingUp} size="sm" className="text-purple-700 dark:text-purple-300" decorative />
            <Text className="text-xs font-bold text-purple-900 dark:text-purple-200">
              {totalHeifersCount} Novilhas
            </Text>
            <Text className="text-[11px] text-purple-700 dark:text-purple-400">em recria</Text>
          </View>
        </View>
      </View>

      {/* Conteúdo Master-Detail */}
      {isTabletOrDesktop ? (
        // LAYOUT TABLET / DESKTOP (Master-Detail lado a lado)
        <View className="flex-1 flex-row gap-4 items-start">
          {/* Coluna da Esquerda: Master List (largura fixa ~380-420px) */}
          <View className="w-[380px] lg:w-[420px] rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3.5">
            {/* Campo de Busca */}
            <View className="mb-3">
              <CampoTexto
                valor={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar por brinco, nome ou pais..."
                limpavel
                iconeEsquerda={<Icon icon={Search} size="sm" className="text-gray-400" decorative />}
              />
            </View>

            {/* Filtros por Sexo */}
            <View className="flex-row gap-1.5 mb-3 bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl">
              {(
                [
                  { id: 'todos', label: `Todos (${calves.length})` },
                  { id: 'femeas', label: 'Fêmeas' },
                  { id: 'machos', label: 'Machos' },
                ] as const
              ).map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setSexFilter(f.id)}
                  className={`flex-1 py-1.5 rounded-lg items-center justify-center ${sexFilter === f.id
                    ? 'bg-white dark:bg-slate-900 shadow-2xs'
                    : ''
                    }`}
                >
                  <Text
                    className={`text-xs font-bold ${sexFilter === f.id
                      ? 'text-pasto-900 dark:text-pasto-200'
                      : 'text-gray-500 dark:text-gray-400'
                      }`}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Lista de Animais */}
            {loading && calves.length === 0 ? (
              <ListLoadingState count={4} />
            ) : error ? (
              <ErrorState message={error} onRetry={refresh} />
            ) : calves.length === 0 ? (
              <EmptyState
                title="Nenhum animal encontrado"
                description={
                  searchQuery
                    ? 'Nenhum resultado para a busca aplicada.'
                    : 'Cadastre a primeira bezerra para iniciar o acompanhamento.'
                }
                actionLabel="+ Cadastrar Bezerra"
                onAction={handleCadastrarNova}
              />
            ) : (
              <View>
                {calves.map((item) => (
                  <CalfListCard
                    key={item.id}
                    item={item}
                    isSelected={item.id === activeCalfId}
                    onPress={() => handleSelectCalf(item.id)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Coluna da Direita: Painel Detalhado Fiel ao Mockup */}
          <View className="flex-1">
            {activeCalf ? (
              <CalfDetailPane
                calf={activeCalf}
                onAdicionarPesagem={handleAdicionarPesagem}
                onExcluirBezerra={excluirBezerra}
              />
            ) : (
              <View className="flex-1 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-8">
                <EmptyState
                  title="Selecione um animal"
                  description="Clique em uma bezerra na lista ao lado para ver a genealogia em 3 níveis, régua de desmame e recria."
                />
              </View>
            )}
          </View>
        </View>
      ) : (
        // LAYOUT MOBILE (<768px): Alternância Fluida Lista / Detalhe
        <View className="flex-1 pt-2">
          {mobileView === 'detail' && activeCalf ? (
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => setMobileView('list')}
                className="flex-row items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800"
              >
                <Icon icon={ArrowLeft} size="sm" className="text-pasto-800 dark:text-pasto-300" decorative />
                <Text className="text-xs font-bold text-pasto-800 dark:text-pasto-300">
                  Voltar para lista de bezerras ({calves.length})
                </Text>
              </TouchableOpacity>

              <CalfDetailPane
                calf={activeCalf}
                onAdicionarPesagem={handleAdicionarPesagem}
                onExcluirBezerra={async (id) => {
                  await excluirBezerra(id);
                  setMobileView('list');
                }}
              />
            </View>
          ) : (
            <View className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3.5">
              {/* Campo de Busca */}
              <View className="mb-2.5">
                <CampoTexto
                  valor={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Buscar por brinco, nome ou pais..."
                  limpavel
                  iconeEsquerda={<Icon icon={Search} size="sm" className="text-gray-400" decorative />}
                />
              </View>

              {/* Filtros por Sexo */}
              <View className="flex-row gap-1.5 mb-3 bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl">
                {(
                  [
                    { id: 'todos', label: `Todos (${calves.length})` },
                    { id: 'femeas', label: 'Fêmeas' },
                    { id: 'machos', label: 'Machos' },
                  ] as const
                ).map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setSexFilter(f.id)}
                    className={`flex-1 py-1.5 rounded-lg items-center justify-center ${sexFilter === f.id
                      ? 'bg-white dark:bg-slate-900 shadow-2xs'
                      : ''
                      }`}
                  >
                    <Text
                      className={`text-xs font-bold ${sexFilter === f.id
                        ? 'text-pasto-900 dark:text-pasto-200'
                        : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Lista Mobile */}
              {loading && calves.length === 0 ? (
                <ListLoadingState count={4} />
              ) : error ? (
                <ErrorState message={error} onRetry={refresh} />
              ) : calves.length === 0 ? (
                <EmptyState
                  title="Nenhum animal encontrado"
                  description="Cadastre a primeira bezerra para iniciar o acompanhamento."
                  actionLabel="+ Cadastrar Bezerra"
                  onAction={handleCadastrarNova}
                />
              ) : (
                <View>
                  {calves.map((item) => (
                    <CalfListCard
                      key={item.id}
                      item={item}
                      isSelected={item.id === activeCalfId}
                      onPress={() => handleSelectCalf(item.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Modal de Cadastro de Nova Bezerra */}
      <RegisterCalfModal
        visivel={modalCadastroAberto}
        onFechar={() => setModalCadastroAberto(false)}
        onSalvar={cadastrarBezerra}
        farmId={farmId}
        brincosExistentes={brincosExistentes}
        tourosDisponiveis={tourosDisponiveis}
        vacasDisponiveis={vacasDisponiveis}
      />

      {/* Modal de Registro de Pesagem Mensal */}
      {activeCalf && (
        <AddWeighingModal
          visivel={modalPesagemAberto}
          onFechar={() => setModalPesagemAberto(false)}
          onSalvar={registrarPesagem}
          earTag={activeCalf.earTag}
          name={activeCalf.name}
          lastWeightKg={activeCalf.growthMetrics?.currentWeightKg}
          birthDate={activeCalf.birthDate}
        />
      )}
    </Screen>
  );
}
