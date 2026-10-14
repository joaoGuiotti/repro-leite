import { Check, Search } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ModalPadrao } from './ModalPadrao';

export interface ItemSeletor {
  id: string;
  tituloPrincipal: string; // Ex.: "Brinco 102" ou "Touro Jaguar TE"
  subtitulo?: string; // Ex.: "Mimosa · Holandesa"
  badgeTexto?: string; // Ex.: "Vazia", "12 doses"
  badgeVariante?: 'sucesso' | 'atencao' | 'alerta' | 'neutro';
  numeroBrinco?: string | number;
  disabled?: boolean;
}

export interface FiltroOpcao {
  id: string;
  label: string;
}

export interface SeletorItemModalProps {
  visivel: boolean;
  onFechar: () => void;
  onSelecionar: (item: ItemSeletor) => void;
  tituloModal: string;
  placeholderBusca: string;
  tipoTeclado?: 'numeric' | 'default';
  itens: ItemSeletor[];
  filtros?: FiltroOpcao[];
  filtroAtivo?: string;
  onMudarFiltro?: (filtroId: string) => void;
  itemSelecionadoId?: string | null;
  rodapeCustomizado?: React.ReactNode;
}

const BADGE_CORES = {
  sucesso: 'bg-pasto-100 text-pasto-900 border-pasto-300',
  atencao: 'bg-ambar-100 text-ambar-800 border-ambar-300',
  alerta: 'bg-alerta-100 text-alerta-800 border-alerta-300',
  neutro: 'bg-gray-100 text-gray-800 border-gray-300',
} as const;

export function SeletorItemModal({
  visivel,
  onFechar,
  onSelecionar,
  tituloModal,
  placeholderBusca,
  tipoTeclado = 'default',
  itens,
  filtros,
  filtroAtivo,
  onMudarFiltro,
  itemSelecionadoId,
  rodapeCustomizado,
}: SeletorItemModalProps) {
  const [termoBusca, setTermoBusca] = useState('');

  const itensFiltrados = useMemo(() => {
    const q = termoBusca.trim().toLowerCase();
    if (!q) return itens;
    return itens.filter(
      (it) =>
        it.tituloPrincipal.toLowerCase().includes(q) ||
        (it.subtitulo && it.subtitulo.toLowerCase().includes(q))
    );
  }, [itens, termoBusca]);

  const fecharELimpar = () => {
    setTermoBusca('');
    onFechar();
  };

  const selecionarItem = (item: ItemSeletor) => {
    if (item.disabled) return;
    onSelecionar(item);
    fecharELimpar();
  };

  return (
    <ModalPadrao
      visivel={visivel}
      onFechar={fecharELimpar}
      titulo={tituloModal}
      larguraMaxima="max-w-md"
      rodape={rodapeCustomizado}
    >
      <View className="w-full">
        {/* Barra de Busca Ágil */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5 mb-3 border border-gray-200">
          <Search size={20} color="#6b7280" />
          <TextInput
            value={termoBusca}
            onChangeText={setTermoBusca}
            placeholder={placeholderBusca}
            placeholderTextColor="#9ca3af"
            keyboardType={tipoTeclado}
            className="flex-1 ml-2 text-base font-semibold text-gray-900 min-h-10"
            autoFocus={false}
          />
        </View>

        {/* Pílulas de Filtro Rápido Opcionais */}
        {filtros && filtros.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-3">
            {filtros.map((f) => {
              const ativo = filtroAtivo === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => onMudarFiltro && onMudarFiltro(f.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtrar por ${f.label}`}
                  className={`px-3 py-1.5 rounded-full border ${
                    ativo
                      ? 'bg-pasto-900 border-pasto-900'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      ativo ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Lista com touch targets confortáveis para curral (min-h-14) */}
        <View className="max-h-80">
          <FlatList
            data={itensFiltrados}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const selecionado = item.id === itemSelecionadoId;
              const badgeCor =
                BADGE_CORES[item.badgeVariante || 'neutro'];

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.tituloPrincipal}
                  disabled={item.disabled}
                  onPress={() => selecionarItem(item)}
                  className={`min-h-14 flex-row items-center justify-between p-3 my-1 rounded-xl border ${
                    selecionado
                      ? 'bg-pasto-50 border-pasto-600'
                      : 'bg-white border-gray-200 active:bg-gray-50'
                  } ${item.disabled ? 'opacity-40' : ''}`}
                >
                  <View className="flex-1 pr-2 flex-row items-center gap-3">
                    {item.numeroBrinco ? (
                      <View className="min-w-[44px] min-h-[42px] px-1.5 py-1 rounded-xl bg-white border border-gray-200/90 items-center justify-center">
                        <Text className="text-[8px] font-black uppercase tracking-wider text-slate-400" numberOfLines={1}>
                          BRINCO
                        </Text>
                        <Text className="text-sm font-black tracking-tight leading-tight text-gray-950" numberOfLines={1}>
                          {item.numeroBrinco}
                        </Text>
                      </View>
                    ) : null}
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                        {item.tituloPrincipal}
                      </Text>
                      {item.subtitulo && (
                        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                          {item.subtitulo}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    {item.badgeTexto && (
                      <View className={`px-2.5 py-1 rounded-full border ${badgeCor}`}>
                        <Text className="text-xs font-bold">
                          {item.badgeTexto}
                        </Text>
                      </View>
                    )}
                    {selecionado && <Check size={20} color="#1b4332" />}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View className="py-8 items-center justify-center">
                <Text className="text-sm font-semibold text-gray-500">
                  Nenhum registro encontrado.
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </ModalPadrao>
  );
}
