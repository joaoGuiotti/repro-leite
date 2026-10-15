import {
  Botao,
  CampoNumerico,
  CampoTexto,
  Icon,
  ItemSeletor,
  ModalPadrao,
  SelectDate,
  SeletorItemModal,
} from '@/ui';
import { Dna } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RegisterCalfInput } from '../../application/register-calf.usecase';
import {
  BullOption,
  CowOption,
  DEFAULT_BIRTH_WEIGHT_KG,
} from '../../domain/calves.types';

export interface RegisterCalfModalProps {
  visivel: boolean;
  onFechar: () => void;
  onSalvar: (dados: RegisterCalfInput) => Promise<void>;
  farmId: string;
  brincosExistentes?: string[];
  tourosDisponiveis?: BullOption[];
  vacasDisponiveis?: CowOption[];
}

const RACAS_SUGERIDAS = ['Girolando', 'Holandesa', 'Jersey', 'Gir Leiteiro'];

export function RegisterCalfModal({
  visivel,
  onFechar,
  onSalvar,
  farmId,
  brincosExistentes = [],
  tourosDisponiveis = [],
  vacasDisponiveis = [],
}: RegisterCalfModalProps) {
  const [brinco, setBrinco] = useState('');
  const [nome, setNome] = useState('');
  const [sexo, setSexo] = useState<'femea' | 'macho'>('femea');
  const [raca, setRaca] = useState('Girolando');
  const [dataNascimento, setDataNascimento] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [pesoNascimento, setPesoNascimento] = useState(String(DEFAULT_BIRTH_WEIGHT_KG));
  const [notas, setNotas] = useState('');

  // Genealogia
  const [touroSelecionado, setTouroSelecionado] = useState<BullOption | null>(null);
  const [vacaSelecionada, setVacaSelecionada] = useState<CowOption | null>(null);
  const [avoMaterna, setAvoMaterna] = useState('');

  // Modais de seleção
  const [seletorTouroAberto, setSeletorTouroAberto] = useState(false);
  const [seletorVacaAberto, setSeletorVacaAberto] = useState(false);

  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Validação de duplicidade de brinco
  const brincoDuplicado = useMemo(() => {
    const limpo = brinco.trim();
    if (!limpo) return false;
    return brincosExistentes.some((b) => b.trim().toLowerCase() === limpo.toLowerCase());
  }, [brinco, brincosExistentes]);

  const podeSalvar =
    brinco.trim().length > 0 &&
    !brincoDuplicado &&
    dataNascimento.trim().length === 10 &&
    !salvando;

  const handleSelecionarTouro = (item: ItemSeletor) => {
    const touro = tourosDisponiveis.find((t) => t.id === item.id);
    if (touro) {
      setTouroSelecionado(touro);
    }
    setSeletorTouroAberto(false);
  };

  const handleSelecionarVaca = (item: ItemSeletor) => {
    const vaca = vacasDisponiveis.find((v) => v.id === item.id);
    if (vaca) {
      setVacaSelecionada(vaca);
      if (vaca.maternalGranddamName && !avoMaterna) {
        setAvoMaterna(vaca.maternalGranddamName);
      }
    }
    setSeletorVacaAberto(false);
  };

  const handleSalvar = async () => {
    if (!podeSalvar) return;
    setErroForm(null);
    try {
      setSalvando(true);
      await onSalvar({
        farmId,
        earTag: brinco.trim(),
        name: nome.trim() || undefined,
        sex: sexo,
        breed: raca.trim() || 'Girolando',
        birthDate: dataNascimento,
        birthWeightKg: parseFloat(pesoNascimento) || DEFAULT_BIRTH_WEIGHT_KG,
        sireId: touroSelecionado?.id,
        sireName: touroSelecionado?.name,
        damId: vacaSelecionada?.id,
        damName: vacaSelecionada?.name || (vacaSelecionada ? `Vaca ${vacaSelecionada.earTag}` : undefined),
        maternalGranddamName: avoMaterna.trim() || undefined,
        notes: notas.trim() || undefined,
      });

      // Reset após sucesso
      setBrinco('');
      setNome('');
      setSexo('femea');
      setRaca('Girolando');
      setPesoNascimento(String(DEFAULT_BIRTH_WEIGHT_KG));
      setTouroSelecionado(null);
      setVacaSelecionada(null);
      setAvoMaterna('');
      setNotas('');
      onFechar();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar bezerra.';
      setErroForm(msg);
    } finally {
      setSalvando(false);
    }
  };

  // Itens para o Seletor de Touros
  const itensTouros: ItemSeletor[] = useMemo(() => {
    return tourosDisponiveis.map((t) => ({
      id: t.id,
      tituloPrincipal: t.name,
      subtitulo: t.breed ?? undefined,
      badgeTexto: 'Touro IA',
      badgeVariante: 'neutro',
    }));
  }, [tourosDisponiveis]);

  // Itens para o Seletor de Vacas
  const itensVacas: ItemSeletor[] = useMemo(() => {
    return vacasDisponiveis.map((v) => ({
      id: v.id,
      tituloPrincipal: `Brinco ${v.earTag}`,
      subtitulo: v.name ?? undefined,
      badgeTexto: 'Mãe',
      badgeVariante: 'neutro',
    }));
  }, [vacasDisponiveis]);

  return (
    <>
      <ModalPadrao
        visivel={visivel}
        onFechar={onFechar}
        titulo="Cadastrar Nova Bezerra"
        subtitulo="Genealogia em 3 níveis e dieta inicial de 4L/dia"
        larguraMaxima="max-w-lg"
        rodape={
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Botao
                titulo="Cancelar"
                variante="contorno"
                onPress={onFechar}
                desabilitado={salvando}
              />
            </View>
            <View className="flex-1">
              <Botao
                titulo="Cadastrar Bezerra"
                variante="primario"
                onPress={handleSalvar}
                desabilitado={!podeSalvar}
              />
            </View>
          </View>
        }
      >
        <ScrollView className="max-h-[70vh] gap-4" showsVerticalScrollIndicator={false}>
          {erroForm ? (
            <View className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3">
              <Text className="text-xs font-bold text-red-800 dark:text-red-300">
                {erroForm}
              </Text>
            </View>
          ) : null}

          {/* Brinco & Nome */}
          <View className="gap-3">
            <CampoNumerico
              rotulo="Número do Brinco *"
              valor={brinco}
              onChange={setBrinco}
              placeholder="Ex: 501"
            />
            {brincoDuplicado && (
              <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                Já existe um animal com este número de brinco.
              </Text>
            )}

            <CampoTexto
              rotulo="Nome da Bezerra (Opcional)"
              valor={nome}
              onChange={setNome}
              placeholder="Ex: Mimosa 501"
            />
          </View>

          {/* Sexo */}
          <View className="gap-1.5 mt-2">
            <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Sexo *
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setSexo('femea')}
                className={`flex-1 py-3 px-4 rounded-xl border items-center justify-center ${sexo === 'femea'
                  ? 'bg-pasto-100 border-pasto-600 dark:bg-pasto-950/60 dark:border-pasto-500'
                  : 'bg-white border-gray-200 dark:bg-slate-900 dark:border-slate-800'
                  }`}
              >
                <Text
                  className={`text-sm font-bold ${sexo === 'femea'
                    ? 'text-pasto-900 dark:text-pasto-200'
                    : 'text-gray-600 dark:text-gray-400'
                    }`}
                >
                  Fêmea (Recria / Leite)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSexo('macho')}
                className={`flex-1 py-3 px-4 rounded-xl border items-center justify-center ${sexo === 'macho'
                  ? 'bg-blue-100 border-blue-600 dark:bg-blue-950/60 dark:border-blue-500'
                  : 'bg-white border-gray-200 dark:bg-slate-900 dark:border-slate-800'
                  }`}
              >
                <Text
                  className={`text-sm font-bold ${sexo === 'macho'
                    ? 'text-blue-900 dark:text-blue-200'
                    : 'text-gray-600 dark:text-gray-400'
                    }`}
                >
                  Macho (Controle)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Raça com chips sugeridos */}
          <View className="gap-1.5 mt-2">
            <CampoTexto
              rotulo="Raça *"
              valor={raca}
              onChange={setRaca}
              placeholder="Ex: Girolando"
            />
            <View className="flex-row flex-wrap gap-2 pt-1">
              {RACAS_SUGERIDAS.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setRaca(item)}
                  className={`px-3 py-1.5 rounded-full border ${raca === item
                    ? 'bg-pasto-700 border-pasto-700'
                    : 'bg-gray-100 border-gray-200 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                >
                  <Text
                    className={`text-xs font-bold ${raca === item
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Data de Nascimento & Peso Inicial */}
          <View className="flex-row gap-3 mt-2">
            <View className="flex-1">
              <SelectDate
                rotulo="Nascimento *"
                valor={dataNascimento}
                onChange={setDataNascimento}
              />
            </View>
            <View className="flex-1">
              <CampoNumerico
                rotulo="Peso Inicial"
                valor={pesoNascimento}
                onChange={setPesoNascimento}
                sufixo="kg"
              />
            </View>
          </View>

          {/* Seção Genealogia em 3 Níveis */}
          <View className="mt-2 mb-2 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-3.5 gap-3 bg-gray-50/50 dark:bg-slate-900/40">
            <Text className="text-sm font-bold uppercase tracking-wider text-pasto-800 dark:text-pasto-400">
              <Icon icon={Dna} size="sm" className="text-pasto-700 dark:text-pasto-300" decorative /> Genealogia em 3 Níveis
            </Text>

            {/* Pai (Touro IA) */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Pai (Touro IA)
              </Text>
              <TouchableOpacity
                onPress={() => setSeletorTouroAberto(true)}
                className="min-h-12 flex-row items-center justify-between rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5"
              >
                <Text
                  className={`text-sm ${touroSelecionado
                    ? 'font-bold text-gray-900 dark:text-slate-100'
                    : 'text-gray-400'
                    }`}
                >
                  {touroSelecionado ? touroSelecionado.name : 'Selecionar touro do catálogo'}
                </Text>
                {touroSelecionado && (
                  <TouchableOpacity
                    onPress={() => setTouroSelecionado(null)}
                    className="p-1"
                  >
                    <Text className="text-xs font-bold text-red-500">Limpar</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {/* Mãe (Vaca do Rebanho) */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Mãe (Vaca do Rebanho)
              </Text>
              <TouchableOpacity
                onPress={() => setSeletorVacaAberto(true)}
                className="min-h-12 flex-row items-center justify-between rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5"
              >
                <Text
                  className={`text-sm ${vacaSelecionada
                    ? 'font-bold text-gray-900 dark:text-slate-100'
                    : 'text-gray-400'
                    }`}
                >
                  {vacaSelecionada
                    ? `Brinco ${vacaSelecionada.earTag} ${vacaSelecionada.name ? `- ${vacaSelecionada.name}` : ''}`
                    : 'Selecionar vaca do rebanho'}
                </Text>
                {vacaSelecionada && (
                  <TouchableOpacity
                    onPress={() => setVacaSelecionada(null)}
                    className="p-1"
                  >
                    <Text className="text-xs font-bold text-red-500">Limpar</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {/* Avó Materna */}
            <CampoTexto
              rotulo="Avó Materna (Opcional)"
              valor={avoMaterna}
              onChange={setAvoMaterna}
              placeholder="Nome ou brinco da avó materna"
            />
          </View>

          {/* Observações */}
          <CampoTexto
            rotulo="Observações"
            valor={notas}
            onChange={setNotas}
            placeholder="Anotações de parto, vigor do bezerro..."
          />
        </ScrollView>
      </ModalPadrao>

      {/* Modal seletor de Touros */}
      <SeletorItemModal
        visivel={seletorTouroAberto}
        onFechar={() => setSeletorTouroAberto(false)}
        onSelecionar={handleSelecionarTouro}
        tituloModal="Selecionar Touro (Pai)"
        placeholderBusca="Buscar por nome ou raça..."
        itens={itensTouros}
        itemSelecionadoId={touroSelecionado?.id}
      />

      {/* Modal seletor de Vacas */}
      <SeletorItemModal
        visivel={seletorVacaAberto}
        onFechar={() => setSeletorVacaAberto(false)}
        onSelecionar={handleSelecionarVaca}
        tituloModal="Selecionar Vaca Mãe"
        placeholderBusca="Buscar por brinco ou nome..."
        tipoTeclado="numeric"
        itens={itensVacas}
        itemSelecionadoId={vacaSelecionada?.id}
      />
    </>
  );
}
