import { evaluateEarTagAvailability } from '@/domain/earTag';
import { AnimalReproStatus, AnimalSex, AnimalSummary } from '@/types/animal';
import { Botao, ModalPadrao, SelectDate } from '@/ui';
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
              <Text className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                NÚMERO DO BRINCO *
              </Text>
              <TextInput
                value={brinco}
                onChangeText={(texto) => {
                  setBrinco(texto);
                  setConfirmouReuso(false);
                }}
                placeholder="Ex: 215"
                keyboardType="numbers-and-punctuation"
                className="h-12 rounded-2xl border border-gray-300 bg-white px-4 text-base text-gray-900"
              />

              {/* Aviso de Brinco em Uso por Ativo (BLOQUEIO) */}
              {brincoBloqueado && (
                <View className="mt-2.5 flex-row items-start rounded-xl border border-red-300 bg-red-50 p-3">
                  <AlertCircle size={18} color="#b91c1c" className="mr-2 mt-0.5" />
                  <View className="flex-1">
                    <Text className="font-bold text-red-900 text-xs">Brinco Bloqueado</Text>
                    <Text className="text-xs text-red-800">{avaliacaoBrinco.message}</Text>
                  </View>
                </View>
              )}

              {/* Aviso de Reuso de Brinco Inativo */}
              {avaliacaoBrinco.status === 'alerta_reuso_inativo' && (
                <View className="mt-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3">
                  <View className="flex-row items-start">
                    <AlertTriangle size={18} color="#b45309" className="mr-2 mt-0.5" />
                    <View className="flex-1">
                      <Text className="font-bold text-amber-950 text-xs">Aviso de Reuso de Brinco</Text>
                      <Text className="text-xs text-amber-900">{avaliacaoBrinco.message}</Text>
                    </View>
                  </View>

                  {!confirmouReuso ? (
                    <View className="mt-2.5 flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => setConfirmouReuso(true)}
                        className="flex-1 items-center rounded-lg bg-amber-600 py-2"
                      >
                        <Text className="font-bold text-white text-xs">Usar mesmo assim</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setBrinco('')}
                        className="flex-1 items-center rounded-lg border border-amber-400 bg-white py-2"
                      >
                        <Text className="font-bold text-amber-800 text-xs">Mudar número</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="mt-2 flex-row items-center">
                      <CheckCircle size={16} color="#15803d" className="mr-1.5" />
                      <Text className="text-xs font-semibold text-green-800">
                        Reuso autorizado para este cadastro.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Apelido / Nome */}
            <View>
              <Text className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                APELIDO / NOME
              </Text>
              <TextInput
                value={nome}
                onChangeText={setNome}
                placeholder="Ex: Boneca"
                className="h-12 rounded-2xl border border-gray-300 bg-white px-4 text-base text-gray-900"
              />
            </View>

            {/* Raça / Composição */}
            <View>
              <Text className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                RAÇA / COMPOSIÇÃO *
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mb-2">
                {RACAS_SUGERIDAS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRaca(r)}
                    className={`px-3 py-1.5 rounded-xl border ${raca === r
                        ? 'bg-pasto-100 border-pasto-700'
                        : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <Text
                      className={`text-xs font-bold ${raca === r ? 'text-pasto-900' : 'text-gray-700'
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
                className="h-12 rounded-2xl border border-gray-300 bg-white px-4 text-base text-gray-900"
              />
            </View>

            {/* Sexo */}
            <View>
              <Text className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                SEXO DO ANIMAL *
              </Text>
              <View className="flex-row gap-2.5">
                <TouchableOpacity
                  onPress={() => setSexo('femea')}
                  className={`flex-1 items-center justify-center rounded-2xl py-3 border ${sexo === 'femea'
                      ? 'bg-pasto-700 border-pasto-700'
                      : 'bg-white border-gray-300'
                    }`}
                >
                  <Text
                    className={`font-bold text-sm ${sexo === 'femea' ? 'text-white' : 'text-gray-700'
                      }`}
                  >
                    Fêmea (Vaca / Novilha)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSexo('macho')}
                  className={`flex-1 items-center justify-center rounded-2xl py-3 border ${sexo === 'macho'
                      ? 'bg-pasto-700 border-pasto-700'
                      : 'bg-white border-gray-300'
                    }`}
                >
                  <Text
                    className={`font-bold text-sm ${sexo === 'macho' ? 'text-white' : 'text-gray-700'
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
                <Text className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
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
                          ? 'bg-pasto-100 border-pasto-600'
                          : 'bg-white border-gray-200'
                        }`}
                    >
                      <Text
                        className={`text-xs font-bold ${statusRepro === st.id ? 'text-pasto-900' : 'text-gray-700'
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
                <Text className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  PESO NASC. (KG)
                </Text>
                <TextInput
                  value={pesoNascimento}
                  onChangeText={setPesoNascimento}
                  placeholder="40"
                  keyboardType="numeric"
                  className="h-12 rounded-2xl border border-gray-300 bg-white px-4 text-base text-gray-900"
                />
              </View>
            </View>
          </ScrollView>
    </ModalPadrao>
  );
}
