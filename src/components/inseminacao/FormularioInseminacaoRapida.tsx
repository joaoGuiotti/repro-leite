import { useManagementDate } from '@core/simulation';
import { AnimalRepository } from '@/db/repositories/animalRepository';
import { BullRepository } from '@/db/repositories/bullRepository';
import { InseminationRepository } from '@/db/repositories/inseminationRepository';
import { checkConsanguinity } from '@/domain/consanguinity';
import { calculateReproductiveMilestones } from '@/domain/reproduction';
import { AnimalRecord } from '@/types/animal';
import { BullRecord } from '@/types/bull';
import {
  BannerAlerta,
  Botao,
  CampoTexto,
  ItemSeletor,
  SelectDate,
  SeletorItemModal,
} from '@/ui';
import { PainelProjecaoZootecnica } from '@features/reproduction';
import { CheckCircle2, ChevronDown, Repeat } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ModalAbastecimentoDoses } from './ModalAbastecimentoDoses';

export interface FormularioInseminacaoRapidaProps {
  farmId: string;
  vacaPreSelecionada?: AnimalRecord | null;
  onInseminacaoConcluida?: () => void;
}

export function FormularioInseminacaoRapida({
  farmId,
  vacaPreSelecionada,
  onInseminacaoConcluida,
}: FormularioInseminacaoRapidaProps) {
  const { activeDateString } = useManagementDate();

  // Estados de dados disponíveis
  const [femeas, setFemeas] = useState<AnimalRecord[]>([]);
  const [touros, setTouros] = useState<BullRecord[]>([]);

  // Estados do formulário
  const [vacaManual, setVacaManual] = useState<AnimalRecord | null | undefined>(undefined);
  const vacaSelecionada = vacaManual !== undefined ? vacaManual : (vacaPreSelecionada ?? null);
  const setVacaSelecionada = (v: AnimalRecord | null) => setVacaManual(v);

  const [touroSelecionado, setTouroSelecionado] = useState<BullRecord | null>(null);
  const [modoTouroAvulso, setModoTouroAvulso] = useState(false);
  const [nomeTouroAvulso, setNomeTouroAvulso] = useState('');

  const [dataIA, setDataIA] = useState<string>(
    activeDateString || new Date().toISOString().split('T')[0]
  );

  const [inseminador, setInseminador] = useState('Inseminador Padrão');
  const [observacoes, setObservacoes] = useState('');

  // Modais de seleção
  const [modalVacaAberto, setModalVacaAberto] = useState(false);
  const [filtroVaca, setFiltroVaca] = useState<string>('aptas');
  const [modalTouroAberto, setModalTouroAberto] = useState(false);
  const [modalAbastecerAberto, setModalAbastecerAberto] = useState(false);

  // Controle de alertas e gravação com ciência derivada por par vaca-touro
  const [chaveCiencia, setChaveCiencia] = useState<string | null>(null);
  const chaveParAtual = `${vacaSelecionada?.id ?? ''}_${modoTouroAvulso ? nomeTouroAvulso.trim() : touroSelecionado?.id ?? ''}`;
  const cienteConsanguinidade = chaveCiencia === chaveParAtual && chaveParAtual.length > 1;
  const setCienteConsanguinidade = (ciente: boolean) => {
    setChaveCiencia(ciente ? chaveParAtual : null);
  };

  const [salvando, setSalvando] = useState(false);

  // Carrega fêmeas ativas e catálogo de touros
  const carregarOpcoes = useCallback(async () => {
    try {
      const [listaAnimais, listaTouros] = await Promise.all([
        AnimalRepository.listByFarm(farmId, true),
        BullRepository.listByFarm(farmId),
      ]);
      const femeasAtivas = listaAnimais.filter(
        (a) => a.sex === 'femea' && a.exitStatus === 'ativo'
      );
      setFemeas(femeasAtivas);
      setTouros(listaTouros);
    } catch (err) {
      console.error('Erro ao carregar dados para inseminação:', err);
    }
  }, [farmId]);

  useEffect(() => {
    let ativo = true;

    async function buscar() {
      try {
        const [listaAnimais, listaTouros] = await Promise.all([
          AnimalRepository.listByFarm(farmId, true),
          BullRepository.listByFarm(farmId),
        ]);
        if (ativo) {
          const femeasAtivas = listaAnimais.filter(
            (a) => a.sex === 'femea' && a.exitStatus === 'ativo'
          );
          setFemeas(femeasAtivas);
          setTouros(listaTouros);
        }
      } catch (err) {
        console.error('Erro ao carregar dados para inseminação:', err);
      }
    }

    void buscar();

    return () => {
      ativo = false;
    };
  }, [farmId]);

  // Cálculo de projeções em tempo real a partir da data da IA selecionada
  const milestones = useMemo(() => {
    return calculateReproductiveMilestones(dataIA);
  }, [dataIA]);

  // Checagem determinística de consanguinidade
  const consanguinidade = useMemo(() => {
    if (!vacaSelecionada) return { isConsanguineous: false };

    const bullTarget = modoTouroAvulso
      ? { name: nomeTouroAvulso.trim() }
      : touroSelecionado
        ? { id: touroSelecionado.id, name: touroSelecionado.name }
        : null;

    if (!bullTarget || !bullTarget.name) {
      return { isConsanguineous: false };
    }

    return checkConsanguinity(
      {
        sireId: vacaSelecionada.sireId,
        sireName: vacaSelecionada.sireName,
        maternalGrandsireName: vacaSelecionada.maternalGrandsireName,
        paternalGrandsireName: vacaSelecionada.paternalGrandsireName,
      },
      bullTarget
    );
  }, [vacaSelecionada, touroSelecionado, modoTouroAvulso, nomeTouroAvulso]);

  // Itens para o Seletor de Fêmeas com filtro inteligente
  const itensFemeas: ItemSeletor[] = useMemo(() => {
    return femeas
      .filter((f) => {
        if (filtroVaca === 'aptas') {
          return f.reproStatus === 'vazia' || f.lifeStage === 'novilha_apta_ia';
        }
        if (filtroVaca === 'inseminadas') {
          return f.reproStatus === 'inseminada';
        }
        return true;
      })
      .map((f) => {
        let varianteBadge: ItemSeletor['badgeVariante'] = 'neutro';
        if (f.reproStatus === 'vazia') varianteBadge = 'sucesso';
        else if (f.reproStatus === 'inseminada') varianteBadge = 'atencao';
        else if (f.reproStatus === 'prenhe') varianteBadge = 'alerta';

        return {
          id: f.id,
          numeroBrinco: f.earTag,
          tituloPrincipal: f.name || `Animal #${f.earTag}`,
          subtitulo: `${f.breed} · ${f.reproStatus.toUpperCase()}`,
          badgeTexto: f.reproStatus.toUpperCase(),
          badgeVariante: varianteBadge,
        };
      });
  }, [femeas, filtroVaca]);

  // Itens para o Seletor de Touros
  const itensTouros: ItemSeletor[] = useMemo(() => {
    return touros.map((t) => {
      let varianteBadge: ItemSeletor['badgeVariante'] = 'sucesso';
      if (t.strawsInStock === 0) varianteBadge = 'alerta';
      else if (t.strawsInStock <= 3) varianteBadge = 'atencao';

      return {
        id: t.id,
        tituloPrincipal: t.name,
        subtitulo: `${t.breed}${t.code ? ` · ${t.code}` : ''}`,
        badgeTexto:
          t.strawsInStock === 0
            ? '0 doses (Zerado)'
            : `${t.strawsInStock} ${t.strawsInStock === 1 ? 'dose' : 'doses'}`,
        badgeVariante: varianteBadge,
      };
    });
  }, [touros]);

  const nomeTouroFinal = modoTouroAvulso
    ? nomeTouroAvulso.trim()
    : touroSelecionado?.name ?? '';

  const podeSalvar =
    !!vacaSelecionada &&
    !!nomeTouroFinal &&
    !!dataIA &&
    !!inseminador.trim() &&
    (!consanguinidade.isConsanguineous || cienteConsanguinidade);

  // Executa o salvamento
  const salvarInseminacao = async (repetirParaOutra: boolean) => {
    if (!vacaSelecionada) {
      Alert.alert('Seleção Obrigatória', 'Selecione uma fêmea para inseminar.');
      return;
    }
    if (!nomeTouroFinal) {
      Alert.alert('Seleção Obrigatória', 'Selecione ou informe um touro.');
      return;
    }

    // Alerta de segurança caso o animal já esteja gestante ou com IA recente
    if (vacaSelecionada.reproStatus === 'prenhe' || vacaSelecionada.reproStatus === 'inseminada') {
      const confirmarSobreposicao = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Atenção: Ciclo Ativo',
          `A vaca Brinco ${vacaSelecionada.earTag} já possui status '${vacaSelecionada.reproStatus}'. Registrar uma nova inseminação substituirá o ciclo ativo e cancelará os alertas precedentes. Deseja prosseguir?`,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Sim, Prosseguir', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });
      if (!confirmarSobreposicao) return;
    }

    try {
      setSalvando(true);
      await InseminationRepository.createInsemination(farmId, {
        animalId: vacaSelecionada.id,
        bullId: modoTouroAvulso ? null : touroSelecionado?.id,
        bullName: nomeTouroFinal,
        date: dataIA,
        inseminator: inseminador.trim(),
        notes: observacoes.trim() || null,
      });

      Alert.alert(
        'Inseminação Registrada! 🐮',
        `A vaca Brinco ${vacaSelecionada.earTag} foi marcada como Inseminada com sucesso.`
      );

      // Recarrega opções
      await carregarOpcoes();
      onInseminacaoConcluida?.();

      if (repetirParaOutra) {
        // Mantém touro, data e inseminador, limpando apenas a vaca e observação
        setVacaSelecionada(null);
        setObservacoes('');
        // Reabre imediatamente a seleção de vaca para o próximo animal do curral
        setModalVacaAberto(true);
      } else {
        // Limpa todo o formulário
        setVacaSelecionada(null);
        setTouroSelecionado(null);
        setModoTouroAvulso(false);
        setNomeTouroAvulso('');
        setObservacoes('');
      }
    } catch (err) {
      console.error('Erro ao salvar inseminação:', err);
      Alert.alert('Erro ao Salvar', 'Ocorreu uma falha ao persistir a inseminação no banco local.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
      <View className="gap-3.5 pb-12">
        {/* Cabeçalho Limpo e Compacto */}
        <View className="mb-0.5">
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-full bg-emerald-100 items-center justify-center">
              <Text className="text-xs font-black text-emerald-800">IA</Text>
            </View>
            <Text className="text-base font-black text-gray-950">
              Registrar Nova Inseminação Artificial
            </Text>
          </View>
          <Text className="text-xs text-gray-500 mt-1 leading-4">
            Preencha a vaca e o touro. As datas de retorno do cio (21 dias), toque e previsão de parto são calculadas na hora.
          </Text>
        </View>

        {/* LINHA 1: VACA + TOURO (Duas Colunas) */}
        <View className="flex-row gap-3">
          {/* Coluna 1: VACA A SER INSEMINADA */}
          <View className="flex-1 gap-1">
            <Text className="text-xs font-bold uppercase tracking-wide text-gray-700">
              VACA A SER INSEMINADA *
            </Text>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                vacaSelecionada
                  ? `Vaca: Brinco ${vacaSelecionada.earTag} - ${vacaSelecionada.name || ''}`
                  : 'Selecionar Vaca'
              }
              onPress={() => setModalVacaAberto(true)}
              className="h-12 flex-row items-center justify-between rounded-2xl border border-gray-300 bg-white px-3.5 active:bg-gray-50"
            >
              <Text
                className={`text-sm font-bold flex-1 mr-1 ${
                  vacaSelecionada ? 'text-gray-900' : 'text-gray-400'
                }`}
                numberOfLines={1}
              >
                {vacaSelecionada
                  ? `Brinco ${vacaSelecionada.earTag} - ${vacaSelecionada.name || 'Sem nome'}${
                      vacaSelecionada.reproStatus === 'inseminada' ? ' (INSEMINADA)' : ''
                    }`
                  : 'Selecionar vaca...'}
              </Text>
              <ChevronDown size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Coluna 2: TOURO UTILIZADO */}
          <View className="flex-1 gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-wide text-gray-700" numberOfLines={1}>
                TOURO UTILIZADO *
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModoTouroAvulso(!modoTouroAvulso);
                  setTouroSelecionado(null);
                  setNomeTouroAvulso('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className="text-[10px] font-bold text-pasto-800">
                  {modoTouroAvulso ? '← Catálogo' : '+ Avulso'}
                </Text>
              </TouchableOpacity>
            </View>

            {modoTouroAvulso ? (
              <View className="h-12 justify-center">
                <TextInput
                  placeholder="Nome do touro avulso..."
                  placeholderTextColor="#9ca3af"
                  value={nomeTouroAvulso}
                  onChangeText={setNomeTouroAvulso}
                  className="h-12 rounded-2xl border border-gray-300 bg-white px-3.5 text-sm font-bold text-gray-900"
                />
              </View>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                  touroSelecionado
                    ? `Touro: ${touroSelecionado.name}`
                    : 'Selecionar Touro'
                }
                onPress={() => setModalTouroAberto(true)}
                className="h-12 flex-row items-center justify-between rounded-2xl border border-gray-300 bg-white px-3.5 active:bg-gray-50"
              >
                <Text
                  className={`text-sm font-bold flex-1 mr-1 ${
                    touroSelecionado ? 'text-gray-900' : 'text-gray-400'
                  }`}
                  numberOfLines={1}
                >
                  {touroSelecionado
                    ? `${touroSelecionado.name}${
                        touroSelecionado.breed ? ` (${touroSelecionado.breed})` : ''
                      } — ${touroSelecionado.strawsInStock} doses`
                    : 'Selecionar touro...'}
                </Text>
                <ChevronDown size={18} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* LINHA 2: DATA DA IA + INSEMINADOR (Duas Colunas) */}
        <View className="flex-row gap-3">
          {/* Coluna 1: DATA DA INSEMINAÇÃO com SelectDate */}
          <SelectDate
            rotulo="DATA DA INSEMINAÇÃO"
            valor={dataIA}
            onChange={(novaData) => setDataIA(novaData)}
            className="flex-1"
          />

          {/* Coluna 2: INSEMINADOR / RESPONSÁVEL */}
          <View className="flex-1 gap-1">
            <Text className="text-xs font-bold uppercase tracking-wide text-gray-700">
              INSEMINADOR / RESPONSÁVEL
            </Text>
            <View className="h-12 flex-row items-center rounded-2xl border border-gray-300 bg-white px-3.5">
              <TextInput
                accessibilityLabel="Inseminador responsável"
                placeholder="Nome do inseminador..."
                placeholderTextColor="#9ca3af"
                value={inseminador}
                onChangeText={setInseminador}
                className="flex-1 text-base font-bold text-gray-900"
              />
            </View>
          </View>
        </View>

        {/* Alerta contextual de doses zeradas */}
        {!modoTouroAvulso &&
          touroSelecionado &&
          touroSelecionado.strawsInStock === 0 && (
            <BannerAlerta
              variante="alerta"
              titulo="Estoque Zerado no Aplicativo"
              mensagem={`O estoque de ${touroSelecionado.name} consta com 0 doses. Deseja abastecer novas palhetas ou prosseguir mesmo assim?`}
              textoAcao="+ Adicionar Doses"
              onAcao={() => setModalAbastecerAberto(true)}
            />
          )}

        {/* Banner Preventivo de Consanguinidade */}
        {consanguinidade.isConsanguineous && (
          <BannerAlerta
            variante="atencao"
            titulo="Alerta Zootécnico: Risco de Consanguinidade"
            mensagem={
              consanguinidade.warningMessage ||
              'O reprodutor selecionado possui parentesco próximo com esta vaca.'
            }
            textoAcao={
              cienteConsanguinidade
                ? '✓ Ciência Confirmada'
                : 'Prosseguir mesmo assim'
            }
            onAcao={() => setCienteConsanguinidade(true)}
          />
        )}

        {/* PAINEL DE CÁLCULOS AUTOMÁTICOS PARA ESTA INSEMINAÇÃO */}
        <PainelProjecaoZootecnica
          dataIA={dataIA}
          retornoCioData={milestones.expectedHeatDate}
          toqueData={milestones.pregnancyCheckDate}
          partoPrevistoData={milestones.expectedCalvingDate}
          secagemData={milestones.dryOffDate}
        />

        {/* Observações Opcionais */}
        <CampoTexto
          rotulo="Observações Operacionais (Opcional)"
          valor={observacoes}
          onChange={setObservacoes}
          placeholder="Ex: Cio natural vigoroso, muco cristalino..."
        />

        {/* BOTÃO DE SALVAMENTO PRIMÁRIO (Conforme Imagem) */}
        <View className="gap-2 mt-1">
          <Botao
            titulo={
              salvando
                ? 'Gravando Inseminação...'
                : 'Salvar Inseminação e Programar Alertas'
            }
            accessibilityLabel="Salvar Inseminação e Programar Alertas"
            variante="primario"
            principal
            desabilitado={!podeSalvar || salvando}
            icone={<CheckCircle2 size={18} color="#fff" />}
            onPress={() => salvarInseminacao(false)}
          />

          <Botao
            titulo="Salvar e Inseminar Outra Fêmea"
            accessibilityLabel="Confirmar e Inseminar Outra Fêmea"
            variante="secundario"
            desabilitado={!podeSalvar || salvando}
            icone={<Repeat size={18} color="#1b4332" />}
            onPress={() => salvarInseminacao(true)}
          />
        </View>
      </View>

      {/* Modal de Seleção de Fêmea */}
      <SeletorItemModal
        visivel={modalVacaAberto}
        onFechar={() => setModalVacaAberto(false)}
        onSelecionar={(item) => {
          const animal = femeas.find((f) => f.id === item.id) ?? null;
          setVacaSelecionada(animal);
        }}
        tituloModal="Selecionar Fêmea para Inseminar"
        placeholderBusca="Digitar número do brinco..."
        tipoTeclado="numeric"
        itens={itensFemeas}
        filtros={[
          { id: 'aptas', label: 'Aptas (Vazias)' },
          { id: 'todas', label: 'Todas as Fêmeas' },
          { id: 'inseminadas', label: 'Inseminadas' },
        ]}
        filtroAtivo={filtroVaca}
        onMudarFiltro={setFiltroVaca}
        itemSelecionadoId={vacaSelecionada?.id}
      />

      {/* Modal de Seleção de Touro */}
      <SeletorItemModal
        visivel={modalTouroAberto}
        onFechar={() => setModalTouroAberto(false)}
        onSelecionar={(item) => {
          const t = touros.find((x) => x.id === item.id) ?? null;
          setTouroSelecionado(t);
        }}
        tituloModal="Selecionar Touro do Catálogo"
        placeholderBusca="Buscar por nome ou raça do touro..."
        tipoTeclado="default"
        itens={itensTouros}
        itemSelecionadoId={touroSelecionado?.id}
        rodapeCustomizado={
          <Botao
            titulo="+ Informar Touro Avulso"
            variante="secundario"
            onPress={() => {
              setModalTouroAberto(false);
              setModoTouroAvulso(true);
            }}
          />
        }
      />

      {/* Modal de Abastecimento Rápido de Doses */}
      <ModalAbastecimentoDoses
        visivel={modalAbastecerAberto}
        onFechar={() => setModalAbastecerAberto(false)}
        touro={touroSelecionado}
        onAbastecido={(touroAtualizado) => {
          setTouroSelecionado(touroAtualizado);
          carregarOpcoes();
        }}
      />
    </ScrollView>
  );
}
