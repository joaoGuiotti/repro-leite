import { evaluateEarTagAvailability } from '../../domain/ear-tag';
import { AnimalReproStatus, AnimalSex, AnimalSummary } from '../../domain/animal.entity';
import { Botao, CampoNumerico, ModalPadrao, SelectDate } from '@/ui';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ModalCadastroAnimalProps {
  visivel: boolean;
  onFechar: () => void;
  onSalvar: (dados: {
    earTag: string;
    name?: string;
    breed: string;
    sex: AnimalSex;
    birthDate: string;
    birthWeightKg: number;
    reproStatus?: AnimalReproStatus;
  }) => Promise<void>;
  animaisExistentes: AnimalSummary[];
  farmId: string;
}

const RACAS_SUGERIDAS = ['Holandesa', 'Girolando', 'Jersey', 'Gir Leiteiro', 'Pardo Suíço'];

export function ModalCadastroAnimal({
  visivel,
  onFechar,
  onSalvar,
  animaisExistentes,
}: ModalCadastroAnimalProps) {
  const [brinco, setBrinco] = useState('');
  const [nome, setNome] = useState('');
  const [raca, setRaca] = useState('Girolando');
  const [sexo, setSexo] = useState<AnimalSex>('femea');
  const [statusRepro, setStatusRepro] = useState<AnimalReproStatus>('vazia');
  const [dataNascimento, setDataNascimento] = useState(() => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  });
  const [pesoNascimento, setPesoNascimento] = useState('40');
  const [salvando, setSalvando] = useState(false);
  const [confirmouReuso, setConfirmouReuso] = useState(false);

  // Avaliação em tempo real da política de reuso de brinco
  const avaliacaoBrinco = useMemo(() => {
    return evaluateEarTagAvailability(animaisExistentes, brinco);
  }, [animaisExistentes, brinco]);

  const brincoBloqueado = avaliacaoBrinco.status === 'bloqueado_ativo';
  const requerConfirmacaoReuso =
    avaliacaoBrinco.status === 'alerta_reuso_inativo' && !confirmouReuso;

  const podeSalvar =
    brinco.trim().length > 0 &&
    raca.trim().length > 0 &&
    dataNascimento.trim().length === 10 &&
    !brincoBloqueado &&
    !requerConfirmacaoReuso &&
    !salvando;

  const handleSalvar = async () => {
    if (!podeSalvar) return;

    try {
      setSalvando(true);
      await onSalvar({
        earTag: brinco.trim(),
        name: nome.trim() || undefined,
        breed: raca.trim(),
        sex: sexo,
        birthDate: dataNascimento,
        birthWeightKg: parseFloat(pesoNascimento) || 40,
        reproStatus: sexo === 'femea' ? statusRepro : undefined,
      });

      // Reset
      setBrinco('');
      setNome('');
      setConfirmouReuso(false);
      onFechar();
    } catch (error) {
      console.error('Erro ao salvar animal:', error);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalPadrao
      visivel={visivel}
      onFechar={onFechar}
      titulo={sexo === 'macho' ? 'Cadastrar Novo Touro' : 'Cadastrar Nova Vaca'}
      rodape={
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Botao
              titulo="Cancelar"
              onPress={onFechar}
              variante="secundario"
            />
          </View>
          <View className="flex-1">
            <Botao
              titulo={salvando ? 'Salvando...' : sexo === 'macho' ? 'Salvar Animal' : 'Salvar Vaca'}
              onPress={handleSalvar}
              variante="primario"
              desabilitado={!podeSalvar}
            />
          </View>
        </View>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4 py-2"
      >
        {/* Campo Brinco */}
        <View>
          <CampoNumerico
            rotulo="NÚMERO DO BRINCO *"
            valor={brinco}
            onChange={(texto) => {
              setBrinco(texto);
              setConfirmouReuso(false);
            }}
            placeholder="Ex: 215"
          />

          {/* Aviso de Brinco em Uso por Ativo (BLOQUEIO) */}
          {brincoBloqueado && (
            <View className="mt-2.5 flex-row items-start rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3">
              <AlertCircle size={18} color="#b91c1c" className="mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="font-bold text-red-900 dark:text-red-200 text-xs">Brinco Bloqueado</Text>
                <Text className="text-xs text-red-800 dark:text-red-300">{avaliacaoBrinco.message}</Text>
              </View>
            </View>
          )}

          {/* Aviso de Reuso de Brinco Inativo */}
          {avaliacaoBrinco.status === 'alerta_reuso_inativo' && (
            <View className="mt-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3">
              <View className="flex-row items-start">
                <AlertTriangle size={18} color="#b45309" className="mr-2 mt-0.5" />
                <View className="flex-1">
                  <Text className="font-bold text-amber-950 dark:text-amber-200 text-xs">Aviso de Reuso de Brinco</Text>
                  <Text className="text-xs text-amber-900 dark:text-amber-300">{avaliacaoBrinco.message}</Text>
                </View>
              </View>

              {!confirmouReuso ? (
                <View className="mt-2.5 flex-row gap-2">
                  <View className="flex-1">
                    <Botao
                      titulo="Usar mesmo assim"
                      onPress={() => setConfirmouReuso(true)}
                      variante="aviso"
                      tamanho="sm"
                    />
                  </View>
                  <View className="flex-1">
                    <Botao
                      titulo="Mudar número"
                      onPress={() => setBrinco('')}
                      variante="contorno"
                      tamanho="sm"
                    />
                  </View>
                </View>
              ) : (
                <View className="mt-2 flex-row items-center">
                  <CheckCircle size={16} color="#15803d" className="mr-1.5" />
                  <Text className="text-xs font-semibold text-green-800 dark:text-green-300">
                    Reuso autorizado para este cadastro.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Apelido / Nome */}
        <View>
          <Text className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
            APELIDO / NOME
          </Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Boneca"
            placeholderTextColor="#94a3b8"
            className="h-12 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-base text-gray-900 dark:text-slate-100"
          />
        </View>

        {/* Raça / Composição */}
        <View>
          <Text className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
            RAÇA / COMPOSIÇÃO *
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mb-2">
            {RACAS_SUGERIDAS.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRaca(r)}
                className={`px-3 py-1.5 rounded-xl border ${raca === r
                  ? 'bg-pasto-100 dark:bg-pasto-950/60 border-pasto-700 dark:border-pasto-600'
                  : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                  }`}
              >
                <Text
                  className={`text-xs font-bold ${raca === r ? 'text-pasto-900 dark:text-pasto-200' : 'text-gray-700 dark:text-gray-300'
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
            placeholderTextColor="#94a3b8"
            className="h-12 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-base text-gray-900 dark:text-slate-100"
          />
        </View>

        {/* Sexo */}
        <View>
          <Text className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
            SEXO DO ANIMAL *
          </Text>
          <View className="flex-row gap-2.5">
            <TouchableOpacity
              onPress={() => setSexo('femea')}
              className={`flex-1 items-center justify-center rounded-2xl py-3 border ${sexo === 'femea'
                ? 'bg-pasto-700 border-pasto-700 dark:border-pasto-600'
                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700'
                }`}
            >
              <Text
                className={`font-bold text-sm ${sexo === 'femea' ? 'text-white' : 'text-gray-700 dark:text-gray-200'
                  }`}
              >
                Fêmea (Vaca / Novilha)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSexo('macho')}
              className={`flex-1 items-center justify-center rounded-2xl py-3 border ${sexo === 'macho'
                ? 'bg-pasto-700 border-pasto-700 dark:border-pasto-600'
                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700'
                }`}
            >
              <Text
                className={`font-bold text-sm ${sexo === 'macho' ? 'text-white' : 'text-gray-700 dark:text-gray-200'
                  }`}
              >
                Macho (Touro / Bezerro)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Reprodutivo Inicial (fêmeas) */}
        {sexo === 'femea' && (
          <View>
            <Text className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
              STATUS REPRODUTIVO ATUAL
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(
                [
                  { id: 'vazia', label: 'Vazia (Apta a Inseminar)' },
                  { id: 'inseminada', label: 'Inseminada' },
                  { id: 'prenhe', label: 'Prenhe' },
                  { id: 'seca', label: 'Seca' },
                ] as const
              ).map((st) => (
                <TouchableOpacity
                  key={st.id}
                  onPress={() => setStatusRepro(st.id)}
                  className={`px-3.5 py-2.5 rounded-2xl border ${statusRepro === st.id
                    ? 'bg-pasto-100 dark:bg-pasto-950/60 border-pasto-600 dark:border-pasto-500'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                    }`}
                >
                  <Text
                    className={`text-xs font-bold ${statusRepro === st.id ? 'text-pasto-900 dark:text-pasto-200' : 'text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Nascimento & Peso */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <SelectDate
              rotulo="DATA NASC."
              valor={dataNascimento}
              onChange={setDataNascimento}
              obrigatorio
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">
              PESO NASC. (KG)
            </Text>
            <TextInput
              value={pesoNascimento}
              onChangeText={setPesoNascimento}
              placeholder="40"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              className="h-12 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-base text-gray-900 dark:text-slate-100"
            />
          </View>
        </View>
      </ScrollView>
    </ModalPadrao>
  );
}
