import { CatalogoTouros } from '@/components/touros/CatalogoTouros';
import { FormularioInseminacaoRapida } from '@/components/inseminacao/FormularioInseminacaoRapida';
import { HistoricoInseminacoesRecentes } from '@/components/inseminacao/HistoricoInseminacoesRecentes';
import { DEFAULT_FARM_ID } from '@core/db';
import { BullRepository } from '@/db/repositories/bullRepository';
import { AnimalRecord, HerdScreen } from '@features/herd';
import { BullRecord, CreateBullDTO } from '@/types/bull';
import { Shield, Sparkles, Users } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TelaReproducao() {
  const [secaoAtiva, setSecaoAtiva] = useState<'rebanho' | 'inseminar' | 'touros'>('rebanho');
  const [carregandoTouros, setCarregandoTouros] = useState(true);

  // Touros
  const [touros, setTouros] = useState<BullRecord[]>([]);

  // Contador de animais no rebanho
  const [totalRebanho, setTotalRebanho] = useState<number>(0);

  // Inseminação
  const [vacaPreSelecionada, setVacaPreSelecionada] = useState<AnimalRecord | null>(null);
  const [refreshHistorico, setRefreshHistorico] = useState(0);

  const carregarTouros = useCallback(async () => {
    try {
      const listaTouros = await BullRepository.listByFarm(DEFAULT_FARM_ID);
      setTouros(listaTouros);
    } catch (err) {
      console.error('Erro ao recarregar dados de touros:', err);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function buscarInicial() {
      try {
        const listaTouros = await BullRepository.listByFarm(DEFAULT_FARM_ID);
        if (ativo) {
          setTouros(listaTouros);
        }
      } catch (err) {
        console.error('Erro ao carregar catálogo de touros:', err);
      } finally {
        if (ativo) {
          setCarregandoTouros(false);
        }
      }
    }

    buscarInicial();

    return () => {
      ativo = false;
    };
  }, []);

  // Ações de touros
  const handleCadastrarTouro = async (dados: CreateBullDTO) => {
    await BullRepository.create(dados);
    await carregarTouros();
  };

  const handleAjustarDoses = async (touroId: string, delta: number) => {
    try {
      await BullRepository.adjustStraws(touroId, delta);
      await carregarTouros();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao ajustar estoque';
      Alert.alert('Atenção', msg);
    }
  };

  return (
    <ScrollView className="flex-1 bg-pasto-50" contentContainerClassName="gap-4 p-4 pb-16">
      {/* Seletor Segmentado Superior: Rebanho vs Inseminar vs Touros */}
      <View className="flex-row rounded-2xl bg-gray-200 p-1.5">
        <TouchableOpacity
          onPress={() => setSecaoAtiva('rebanho')}
          className={
            secaoAtiva === 'rebanho'
              ? 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-pasto-700'
              : 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-transparent'
          }
        >
          <Users
            size={16}
            color={secaoAtiva === 'rebanho' ? '#ffffff' : '#4b5563'}
            className="mr-1.5"
          />
          <Text
            className={
              secaoAtiva === 'rebanho'
                ? 'font-black text-xs text-white'
                : 'font-black text-xs text-gray-700'
            }
          >
            Rebanho ({totalRebanho})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setVacaPreSelecionada(null);
            setSecaoAtiva('inseminar');
          }}
          className={
            secaoAtiva === 'inseminar'
              ? 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-pasto-700'
              : 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-transparent'
          }
        >
          <Sparkles
            size={16}
            color={secaoAtiva === 'inseminar' ? '#ffffff' : '#4b5563'}
            className="mr-1.5"
          />
          <Text
            className={
              secaoAtiva === 'inseminar'
                ? 'font-black text-xs text-white'
                : 'font-black text-xs text-gray-700'
            }
          >
            Inseminar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSecaoAtiva('touros')}
          className={
            secaoAtiva === 'touros'
              ? 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-pasto-700'
              : 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-transparent'
          }
        >
          <Shield
            size={16}
            color={secaoAtiva === 'touros' ? '#ffffff' : '#4b5563'}
            className="mr-1.5"
          />
          <Text
            className={
              secaoAtiva === 'touros'
                ? 'font-black text-xs text-white'
                : 'font-black text-xs text-gray-700'
            }
          >
            Touros ({touros.length})
          </Text>
        </TouchableOpacity>
      </View>

      {secaoAtiva === 'rebanho' ? (
        /* Seção Rebanho gerenciada pelo módulo isolado @features/herd */
        <HerdScreen
          farmId={DEFAULT_FARM_ID}
          onInseminateAnimal={(animal) => {
            setVacaPreSelecionada(animal);
            setSecaoAtiva('inseminar');
          }}
          onCountChange={setTotalRebanho}
        />
      ) : secaoAtiva === 'inseminar' ? (
        /* Seção: Lançamento de Inseminação Rápida & Histórico Recente */
        <View className="gap-4">
          <FormularioInseminacaoRapida
            farmId={DEFAULT_FARM_ID}
            vacaPreSelecionada={vacaPreSelecionada}
            onInseminacaoConcluida={() => {
              carregarTouros();
              setRefreshHistorico((prev) => prev + 1);
            }}
          />

          <HistoricoInseminacoesRecentes
            farmId={DEFAULT_FARM_ID}
            refreshTrigger={refreshHistorico}
            onAtualizar={carregarTouros}
          />
        </View>
      ) : carregandoTouros ? (
        <View className="py-12 items-center justify-center">
          <ActivityIndicator size="large" color="#1b4332" />
          <Text className="mt-3 text-sm text-gray-500 font-medium">Carregando dados locais...</Text>
        </View>
      ) : (
        /* Seção: Catálogo de Touros e Estoque de Sêmen */
        <CatalogoTouros
          touros={touros}
          onCadastrarTouro={handleCadastrarTouro}
          onAjustarDoses={handleAjustarDoses}
          farmId={DEFAULT_FARM_ID}
        />
      )}
    </ScrollView>
  );
}
