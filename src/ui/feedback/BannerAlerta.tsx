import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react-native';
import React, { ReactNode } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';

export type BannerAlertaVariante = 'alerta' | 'atencao' | 'sucesso' | 'info';

export interface BannerAlertaProps {
  variante?: BannerAlertaVariante;
  titulo: string;
  mensagem: string;
  icone?: ReactNode;
  textoAcao?: string;
  onAcao?: () => void;
  onFechar?: () => void;
  className?: string;
}

const ESTILOS_VARIANTE = {
  atencao: {
    container: 'bg-ambar-50 border-ambar-300',
    titulo: 'text-ambar-900',
    mensagem: 'text-ambar-800',
    iconePadrao: <AlertTriangle size={22} color="#b45309" />,
    botaoAcao: 'bg-ambar-600 active:bg-ambar-700',
    textoBotao: 'text-white',
  },
  alerta: {
    container: 'bg-alerta-50 border-alerta-300',
    titulo: 'text-alerta-900',
    mensagem: 'text-alerta-800',
    iconePadrao: <AlertCircle size={22} color="#b91c1c" />,
    botaoAcao: 'bg-alerta-600 active:bg-alerta-700',
    textoBotao: 'text-white',
  },
  sucesso: {
    container: 'bg-pasto-50 border-pasto-300',
    titulo: 'text-pasto-900',
    mensagem: 'text-pasto-800',
    iconePadrao: <CheckCircle2 size={22} color="#1b4332" />,
    botaoAcao: 'bg-pasto-800 active:bg-pasto-900',
    textoBotao: 'text-white',
  },
  info: {
    container: 'bg-blue-50 border-blue-300',
    titulo: 'text-blue-900',
    mensagem: 'text-blue-800',
    iconePadrao: <Info size={22} color="#1d4ed8" />,
    botaoAcao: 'bg-blue-600 active:bg-blue-700',
    textoBotao: 'text-white',
  },
} as const;

export function BannerAlerta({
  variante = 'atencao',
  titulo,
  mensagem,
  icone,
  textoAcao,
  onAcao,
  onFechar,
  className = '',
}: BannerAlertaProps) {
  const estilo = ESTILOS_VARIANTE[variante];

  return (
    <View
      className={`rounded-xl border p-4 shadow-sm ${estilo.container} ${className}`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-start gap-3 flex-1 pr-2">
          <View className="pt-0.5">{icone || estilo.iconePadrao}</View>
          <View className="flex-1">
            <Text className={`text-base font-bold ${estilo.titulo}`}>
              {titulo}
            </Text>
            <Text className={`text-sm mt-1 leading-5 ${estilo.mensagem}`}>
              {mensagem}
            </Text>
          </View>
        </View>

        {onFechar && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Fechar alerta"
            onPress={onFechar}
            className="p-1 rounded-md active:bg-black/5"
          >
            <X size={18} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {textoAcao && onAcao && (
        <View className="mt-3 flex-row justify-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={textoAcao}
            onPress={onAcao}
            className={`min-h-12 px-5 py-2.5 rounded-lg flex-row items-center justify-center ${estilo.botaoAcao}`}
          >
            <Text className={`text-sm font-bold ${estilo.textoBotao}`}>
              {textoAcao}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
