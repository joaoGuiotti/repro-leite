import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Botao, CampoNumerico, Icon, ModalPadrao, hapticFeedback } from '@/ui';
import { Check, X } from 'lucide-react-native';
import { FarmParameters } from '../../domain/setting.entity';

export interface EditSettingsModalProps {
  visivel: boolean;
  onFechar: () => void;
  onSalvar: (params: FarmParameters) => Promise<boolean>;
  parametrosAtuais: FarmParameters;
}

function EditSettingsForm({
  onFechar,
  onSalvar,
  parametrosAtuais,
}: Omit<EditSettingsModalProps, 'visivel'>) {
  const [heatWindow, setHeatWindow] = useState(String(parametrosAtuais.heatWindowDays));
  const [pregnancyCheck, setPregnancyCheck] = useState(String(parametrosAtuais.pregnancyCheckDays));
  const [gestation, setGestation] = useState(String(parametrosAtuais.gestationDays));
  const [dryOff, setDryOff] = useState(String(parametrosAtuais.dryOffDays));
  const [breedingWeight, setBreedingWeight] = useState(String(parametrosAtuais.heiferBreedingWeightKg || 360));
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    const hw = parseInt(heatWindow, 10);
    const pc = parseInt(pregnancyCheck, 10);
    const gs = parseInt(gestation, 10);
    const dof = parseInt(dryOff, 10);
    const bw = parseInt(breedingWeight, 10);

    if (isNaN(hw) || hw < 18 || hw > 26) {
      setErro('A janela de retorno de cio deve estar entre 18 e 26 dias.');
      return;
    }
    if (isNaN(pc) || pc < 28 || pc > 90) {
      setErro('O diagnóstico de toque deve estar entre 28 e 90 dias.');
      return;
    }
    if (isNaN(gs) || gs < 270 || gs > 295) {
      setErro('A duração da gestação deve estar entre 270 e 295 dias.');
      return;
    }
    if (isNaN(dof) || dof < 30 || dof > 90) {
      setErro('O período de secagem deve estar entre 30 e 90 dias antes do parto.');
      return;
    }
    if (isNaN(bw) || bw < 300 || bw > 450) {
      setErro('A meta de peso para 1ª IA deve estar entre 300 kg e 450 kg.');
      return;
    }

    setErro(null);
    setSalvando(true);

    try {
      await hapticFeedback.selection();
      const sucesso = await onSalvar({
        heatWindowDays: hw,
        pregnancyCheckDays: pc,
        gestationDays: gs,
        dryOffDays: dof,
        heiferBreedingWeightKg: bw,
      });

      if (sucesso) {
        await hapticFeedback.success();
        onFechar();
      } else {
        setErro('Erro ao salvar os novos parâmetros no banco de dados.');
      }
    } catch {
      setErro('Erro inesperado ao salvar os parâmetros.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalPadrao
      visivel
      onFechar={onFechar}
      titulo="Editar Metas e Prazos"
      subtitulo="Ajuste os parâmetros zootécnicos da fazenda"
    >
      <View className="gap-3.5">
        {erro && (
          <View className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
            <Text className="text-xs font-bold text-red-700 dark:text-red-300">{erro}</Text>
          </View>
        )}

        <CampoNumerico
          rotulo="Janela de Retorno de Cio"
          valor={heatWindow}
          onChange={setHeatWindow}
          sufixo="dias"
          placeholder="21"
        />

        <CampoNumerico
          rotulo="Diagnóstico de Toque / Palpação"
          valor={pregnancyCheck}
          onChange={setPregnancyCheck}
          sufixo="dias"
          placeholder="45"
        />

        <CampoNumerico
          rotulo="Duração Média da Gestação"
          valor={gestation}
          onChange={setGestation}
          sufixo="dias"
          placeholder="282"
        />

        <CampoNumerico
          rotulo="Secagem Pré-Parto"
          valor={dryOff}
          onChange={setDryOff}
          sufixo="dias antes"
          placeholder="60"
        />

        <CampoNumerico
          rotulo="Meta de Peso para 1ª IA de Novilhas"
          valor={breedingWeight}
          onChange={setBreedingWeight}
          sufixo="kg"
          placeholder="360"
        />

        <View className="gap-2.5 pt-3">
          <Botao
            titulo={salvando ? 'Salvando...' : 'Salvar Parâmetros'}
            icone={<Icon icon={Check} size="sm" className="text-white" decorative />}
            onPress={handleSalvar}
            variante="primario"
            principal
            desabilitado={salvando}
          />
          <Botao
            titulo="Cancelar"
            icone={<Icon icon={X} size="sm" className="text-gray-700 dark:text-gray-300" decorative />}
            onPress={onFechar}
            variante="secundario"
            desabilitado={salvando}
          />
        </View>
      </View>
    </ModalPadrao>
  );
}

export function EditSettingsModal(props: EditSettingsModalProps) {
  if (!props.visivel) return null;
  return <EditSettingsForm onFechar={props.onFechar} onSalvar={props.onSalvar} parametrosAtuais={props.parametrosAtuais} />;
}
