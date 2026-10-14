import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
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
      refresh();
      Alert.alert('Sucesso', `Touro "${dados.name}" cadastrado com sucesso!`);
    } else {
      Alert.alert('Erro', 'Não foi possível cadastrar o touro. Verifique os dados.');
    }
  };

  const handleAjustarDoses = async (touroId: string, delta: number) => {
    const atualizado = await adjustStraws(touroId, delta);
    if (atualizado) {
      refresh();
    } else {
      Alert.alert('Atenção', 'Não foi possível ajustar as doses. Verifique se o saldo não ficaria negativo.');
    }
  };

  if (loading) {
    return (
      <View className="py-12 items-center justify-center">
        <ActivityIndicator size="large" color="#1b4332" />
        <Text className="mt-3 text-sm text-gray-500 font-medium">Carregando catálogo de touros...</Text>
      </View>
    );
  }

  return (
    <CatalogoTouros
      touros={bulls}
      onCadastrarTouro={handleCadastrarTouro}
      onAjustarDoses={handleAjustarDoses}
      farmId={farmId}
    />
  );
}
