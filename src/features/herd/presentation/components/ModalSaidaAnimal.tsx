import { AnimalRecord } from '../../domain/animal.entity';
import { Botao, Cartao, ModalPadrao, SelectDate } from '@/ui';
import { AlertTriangle } from 'lucide-react-native';
import { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ModalSaidaAnimalProps {
  animal: AnimalRecord | null;
  visivel: boolean;
  onFechar: () => void;
  onConfirmarSaida: (dados: {
    animalId: string;
    exitStatus: 'vendido' | 'descartado' | 'morto';
    exitDate: string;
    exitReason?: string;
  }) => Promise<void>;
}

export function ModalSaidaAnimal({
  animal,
  visivel,
  onFechar,
  onConfirmarSaida,
}: ModalSaidaAnimalProps) {
  const [motivoSaida, setMotivoSaida] = useState<'vendido' | 'descartado' | 'morto'>('vendido');
  const [dataSaida, setDataSaida] = useState(() => new Date().toISOString().split('T')[0]);
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (!animal) return null;

  const handleConfirmar = async () => {
    try {
      setSalvando(true);
      await onConfirmarSaida({
        animalId: animal.id,
        exitStatus: motivoSaida,
        exitDate: dataSaida,
        exitReason: observacao.trim() || undefined,
      });
      onFechar();
    } catch (err) {
      console.error('Erro ao registrar saída:', err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalPadrao
      visivel={visivel}
      onFechar={onFechar}
      titulo="Registrar Saída do Rebanho"
      subtitulo={`Animal: Brinco ${animal.earTag} ${animal.name ? `(${animal.name})` : ''}`}
      rodape={
        <View className="gap-2.5">
          <Botao
            titulo={salvando ? 'Confirmando Saída...' : 'Confirmar Saída do Rebanho'}
            onPress={handleConfirmar}
            variante="aviso"
            principal
            desabilitado={salvando || dataSaida.length !== 10}
          />
          <Botao
            titulo="Cancelar"
            onPress={onFechar}
            variante="secundario"
          />
        </View>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 py-2">
            {/* Aviso Zootécnico */}
            <View className="flex-row items-start rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3.5">
              <AlertTriangle size={20} color="#b45309" className="mr-2.5 mt-0.5" />
              <View className="flex-1">
                <Text className="font-bold text-amber-950 dark:text-amber-200">Liberação de Brinco</Text>
                <Text className="text-xs text-amber-900 dark:text-amber-300">
                  Ao registrar a saída, o animal é movido para o histórico de inativos e o brinco {animal.earTag} fica livre para reuso. Todo o histórico genealógico permanece intacto.
                </Text>
              </View>
            </View>

            {/* Motivo da Saída */}
            <Cartao titulo="Motivo da Saída *">
              <View className="gap-2">
                {(
                  [
                    { id: 'vendido', label: 'Vendido (Comercialização / Produtor)' },
                    { id: 'descartado', label: 'Descarte (Baixa produtividade / Idade)' },
                    { id: 'morto', label: 'Óbito / Morte Acidental' },
                  ] as const
                ).map((opcao) => (
                  <TouchableOpacity
                    key={opcao.id}
                    onPress={() => setMotivoSaida(opcao.id)}
                    className={`flex-row items-center p-3.5 rounded-xl border ${motivoSaida === opcao.id
                        ? 'border-pasto-700 dark:border-pasto-600 bg-pasto-100 dark:bg-pasto-950/60'
                        : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                  >
                    <View
                      className={`h-4 w-4 rounded-full border mr-3 items-center justify-center ${motivoSaida === opcao.id
                          ? 'border-pasto-700 bg-pasto-700 dark:border-pasto-500 dark:bg-pasto-500'
                          : 'border-gray-400 dark:border-slate-600 bg-white dark:bg-slate-900'
                        }`}
                    >
                      {motivoSaida === opcao.id && (
                        <View className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </View>
                    <Text
                      className={`text-sm font-bold ${motivoSaida === opcao.id ? 'text-pasto-950 dark:text-pasto-200' : 'text-gray-700 dark:text-slate-300'
                        }`}
                    >
                      {opcao.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Cartao>

            {/* Data da Saída */}
            <Cartao titulo="Data da Saída *">
              <SelectDate
                valor={dataSaida}
                onChange={setDataSaida}
                obrigatorio
              />
            </Cartao>

            {/* Observações */}
            <Cartao titulo="Justificativa / Observações (Opcional)">
              <TextInput
                value={observacao}
                onChangeText={setObservacao}
                placeholder="Ex: Venda para vizinho, causa da morte, etc."
                placeholderTextColor="#94a3b8"
                className="h-16 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-gray-900 dark:text-slate-100"
                multiline
              />
            </Cartao>

          </ScrollView>
    </ModalPadrao>
  );
}
