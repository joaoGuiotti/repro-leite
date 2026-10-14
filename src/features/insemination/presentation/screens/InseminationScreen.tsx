import { AnimalRecord } from '@features/herd';
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
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
    <ScrollView
      className="flex-1"
      contentContainerClassName="p-4 gap-4 pb-20"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
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
    </ScrollView>
  );
}
