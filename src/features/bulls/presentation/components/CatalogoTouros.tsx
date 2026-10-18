import { i18n } from '@/i18n';
import {
  AppIcons,
  Botao,
  Cartao,
  EmptyState,
  Icon,
  ListLoadingState,
  PendingSyncBadge,
  hapticFeedback,
} from '@/ui';
import { useSyncStatus } from '@core/sync';
import { FlashList } from '@shopify/flash-list';
import { Minus, Plus } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import { BullRecord, CreateBullDTO } from '../../domain/bull.entity';
import { BadgeEstoqueDoses } from './BadgeEstoqueDoses';
import { ModalCadastroTouro } from './ModalCadastroTouro';

export interface CatalogoTourosProps {
  touros: BullRecord[];
  onCadastrarTouro: (dados: CreateBullDTO) => Promise<void>;
  onAjustarDoses: (touroId: string, delta: number) => Promise<void>;
  farmId: string;
  loading?: boolean;
}

export function CatalogoTouros({
  touros,
  onCadastrarTouro,
  onAjustarDoses,
  farmId,
  loading = false,
}: CatalogoTourosProps) {
  const { isRecordPending } = useSyncStatus();
  const [modalAberto, setModalAberto] = useState(false);

  const handleAdjustStraws = useCallback(
    async (touroId: string, delta: number) => {
      await hapticFeedback.selection();
      await onAjustarDoses(touroId, delta);
    },
    [onAjustarDoses]
  );

  const renderHeader = useMemo(() => {
    return (
      <View className="mb-4">
        <Botao
          titulo={i18n.bulls.registerBull}
          onPress={() => {
            void hapticFeedback.selection();
            setModalAberto(true);
          }}
          variante="primario"
          icone={<Icon icon={AppIcons.add} size="sm" className="text-white" decorative />}
          principal
        />
      </View>
    );
  }, []);

  const renderItem = useCallback(
    ({ item: touro }: { item: BullRecord }) => {
      const semEstoque = touro.strawsInStock <= 0;

      return (
        <View className="mb-3">
          <Cartao>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-black text-gray-950 dark:text-gray-100">{touro.name}</Text>
                  {isRecordPending(touro.id) && <PendingSyncBadge compact />}
                </View>
                <Text className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Raça: <Text className="font-semibold text-gray-900 dark:text-gray-200">{touro.breed}</Text>
                  {touro.code ? ` · Palheta: ${touro.code}` : ''}
                </Text>
                {touro.notes ? (
                  <Text className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">{touro.notes}</Text>
                ) : null}
              </View>

              {/* Badge de Estoque */}
              <BadgeEstoqueDoses saldoDoses={touro.strawsInStock} />
            </View>

            {/* Controles de Ajuste Rápido de Doses com Alvo de Toque >= 48dp */}
            <View className="mt-4 flex-row items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-3">
              <Text className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Ajustar doses no botijão:
              </Text>

              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => handleAdjustStraws(touro.id, -1)}
                  disabled={semEstoque}
                  accessibilityRole="button"
                  accessibilityLabel={`Diminuir uma dose do touro ${touro.name}`}
                  className={`p-2 items-center justify-center rounded-xl border ${semEstoque
                    ? 'border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800/40 opacity-40'
                    : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 active:bg-gray-100 dark:active:bg-slate-700'
                    }`}
                >
                  <Icon
                    icon={Minus}
                    size="sm"
                    className={semEstoque ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-slate-200'}
                    decorative
                  />
                </Pressable>

                <Text className="min-w-[32px] text-center text-base font-black text-gray-900 dark:text-gray-100">
                  {touro.strawsInStock}
                </Text>

                <Pressable
                  onPress={() => handleAdjustStraws(touro.id, 1)}
                  accessibilityRole="button"
                  accessibilityLabel={`Aumentar uma dose do touro ${touro.name}`}
                  className="p-2 items-center justify-center rounded-xl border border-pasto-700 bg-pasto-700 dark:bg-pasto-800 active:bg-pasto-800"
                >
                  <Icon icon={Plus} size="sm" className="text-white" decorative />
                </Pressable>
              </View>
            </View>
          </Cartao>
        </View>
      );
    },
    [handleAdjustStraws, isRecordPending]
  );

  return (
    <View className="flex-1">
      <FlashList
        data={touros}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <ListLoadingState count={3} />
          ) : (
            <EmptyState
              icon={AppIcons.bulls}
              title={i18n.bulls.emptyBulls}
              description={i18n.bulls.emptyBullsAction}
              actionLabel={i18n.bulls.registerBull}
              onAction={() => setModalAberto(true)}
            />
          )
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal de Cadastro de Touro */}
      <ModalCadastroTouro
        visivel={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvar={onCadastrarTouro}
        farmId={farmId}
      />
    </View>
  );
}
