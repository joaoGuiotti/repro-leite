import React, { useEffect } from 'react';
import { Alert, View } from 'react-native';
import { hapticFeedback } from '@/ui';
import { ListBullsUseCase } from '../../application/list-bulls.usecase';
import { RegisterBullUseCase } from '../../application/register-bull.usecase';
import { AdjustBullStrawsUseCase } from '../../application/adjust-bull-straws.usecase';
import { CreateBullDTO } from '../../domain/bull.entity';
import { CatalogoTouros } from '../components/CatalogoTouros';
import { useBulls } from '../hooks/useBulls';
import { useRegisterBull } from '../hooks/useRegisterBull';
import { useAdjustStraws } from '../hooks/useAdjustStraws';

export interface BullsScreenProps {
  farmId: string;
  listUseCase: ListBullsUseCase;
  registerUseCase: RegisterBullUseCase;
  adjustUseCase: AdjustBullStrawsUseCase;
  onCountChange?: (count: number) => void;
}

export function BullsScreen({
  farmId,
  listUseCase,
  registerUseCase,
  adjustUseCase,
  onCountChange,
}: BullsScreenProps) {
  const { bulls, loading, refresh } = useBulls(farmId, listUseCase);
  const { registerBull } = useRegisterBull(registerUseCase);
  const { adjustStraws } = useAdjustStraws(adjustUseCase);

  useEffect(() => {
    onCountChange?.(bulls.length);
  }, [bulls.length, onCountChange]);

  const handleCadastrarTouro = async (dados: CreateBullDTO) => {
    const criado = await registerBull(dados);
    if (criado) {
      await hapticFeedback.success();
      refresh();
      Alert.alert('Sucesso', `Touro "${dados.name}" cadastrado com sucesso!`);
    } else {
      await hapticFeedback.error();
      Alert.alert('Erro', 'Não foi possível cadastrar o touro. Verifique os dados.');
    }
  };

  const handleAjustarDoses = async (touroId: string, delta: number) => {
    const atualizado = await adjustStraws(touroId, delta);
    if (atualizado) {
      refresh();
    } else {
      await hapticFeedback.error();
      Alert.alert('Atenção', 'Não foi possível ajustar as doses. Verifique se o saldo não ficaria negativo.');
    }
  };

  return (
    <View className="flex-1">
      <CatalogoTouros
        touros={bulls}
        onCadastrarTouro={handleCadastrarTouro}
        onAjustarDoses={handleAjustarDoses}
        farmId={farmId}
        loading={loading}
      />
    </View>
  );
}
