import React, { useState } from 'react';
import { Text, View } from 'react-native';
import {
  Botao,
  CampoNumerico,
  CampoTexto,
  ModalPadrao,
  SelectDate,
  hapticFeedback,
} from '@/ui';

export interface AddWeighingModalProps {
  visivel: boolean;
  onFechar: () => void;
  onSalvar: (dados: {
    weightKg: number;
    date: string;
    notes?: string;
  }) => Promise<void>;
  earTag: string;
  name?: string | null;
  lastWeightKg?: number;
  birthDate?: string;
}

export function AddWeighingModal({
  visivel,
  onFechar,
  onSalvar,
  earTag,
  name,
  lastWeightKg,
  birthDate,
}: AddWeighingModalProps) {
  const [peso, setPeso] = useState('');
  const [dataPesagem, setDataPesagem] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [notas, setNotas] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const pesoNum = parseFloat(peso.replace(',', '.'));
  const pesoValido = !isNaN(pesoNum) && pesoNum > 0;
  const dataValida = dataPesagem.trim().length === 10;
  const podeSalvar = pesoValido && dataValida && !salvando;

  const handleSalvar = async () => {
    if (!podeSalvar) return;
    setErroForm(null);

    if (birthDate && dataPesagem < birthDate) {
      setErroForm(`A data não pode ser anterior ao nascimento (${birthDate}).`);
      return;
    }

    try {
      setSalvando(true);
      await onSalvar({
        weightKg: pesoNum,
        date: dataPesagem,
        notes: notas.trim() || undefined,
      });

      hapticFeedback.success();
      setPeso('');
      setNotas('');
      onFechar();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar pesagem.';
      setErroForm(msg);
      hapticFeedback.error();
    } finally {
      setSalvando(false);
    }
  };

  const diferencaPeso =
    pesoValido && lastWeightKg !== undefined ? pesoNum - lastWeightKg : null;

  return (
    <ModalPadrao
      visivel={visivel}
      onFechar={onFechar}
      titulo="Adicionar Pesagem Mensal"
      subtitulo={`Animal Brinco ${earTag}${name ? ` · ${name}` : ''}`}
      larguraMaxima="max-w-md"
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
              titulo="Salvar Pesagem"
              principal
              variante="primario"
              onPress={handleSalvar}
              desabilitado={!podeSalvar}
            />
          </View>
        </View>
      }
    >
      <View className="gap-4">
        {erroForm ? (
          <View className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3">
            <Text className="text-xs font-bold text-red-800 dark:text-red-300">
              {erroForm}
            </Text>
          </View>
        ) : null}

        {/* Peso aferido */}
        <CampoNumerico
          rotulo="Peso Aferido na Balança *"
          valor={peso}
          onChange={setPeso}
          sufixo="kg"
          placeholder="Ex: 85.5"
        />

        {/* Comparativo com último peso */}
        {diferencaPeso !== null && (
          <View className="rounded-xl bg-slate-50 dark:bg-slate-800/80 p-3 border border-slate-200 dark:border-slate-700">
            <Text className="text-xs text-gray-600 dark:text-gray-300">
              Último peso: <Text className="font-bold">{lastWeightKg} kg</Text>
              {' · '}
              Variação: {' '}
              <Text
                className={`font-bold ${
                  diferencaPeso >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {diferencaPeso >= 0 ? `+${diferencaPeso.toFixed(1)}` : diferencaPeso.toFixed(1)} kg
              </Text>
            </Text>
          </View>
        )}

        {/* Data da pesagem */}
        <SelectDate
          rotulo="Data da Pesagem *"
          valor={dataPesagem}
          onChange={setDataPesagem}
        />

        {/* Observações */}
        <CampoTexto
          rotulo="Anotações / Condição Corporal"
          valor={notas}
          onChange={setNotas}
          placeholder="Ex: Escore corporal 3.25, pelagem brilhante..."
        />
      </View>
    </ModalPadrao>
  );
}
