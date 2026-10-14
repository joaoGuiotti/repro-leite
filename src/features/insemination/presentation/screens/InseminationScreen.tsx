import { AnimalRecord } from '@features/herd';
import React, { useState } from 'react';
import { View } from 'react-native';
import { FormularioInseminacaoRapida } from '../components/FormularioInseminacaoRapida';
import { HistoricoInseminacoesRecentes } from '../components/HistoricoInseminacoesRecentes';

export interface InseminationScreenProps {
  farmId: string;
  vacaPreSelecionada?: AnimalRecord | null;
  onInseminacaoConcluida?: () => void;
}

export function InseminationScreen({
  farmId,
  vacaPreSelecionada,
  onInseminacaoConcluida,
}: InseminationScreenProps) {
  const [refreshHistorico, setRefreshHistorico] = useState(0);

  const handleInseminacaoConcluida = () => {
    setRefreshHistorico((prev) => prev + 1);
    onInseminacaoConcluida?.();
  };

  return (
    <View className="gap-4">
      <FormularioInseminacaoRapida
        farmId={farmId}
        vacaPreSelecionada={vacaPreSelecionada}
        onInseminacaoConcluida={handleInseminacaoConcluida}
      />

      <HistoricoInseminacoesRecentes
        farmId={farmId}
        refreshTrigger={refreshHistorico}
        onAtualizar={() => {
          setRefreshHistorico((prev) => prev + 1);
        }}
      />
    </View>
  );
}
