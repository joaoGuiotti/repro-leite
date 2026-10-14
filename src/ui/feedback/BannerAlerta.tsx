import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Botao } from '../primitives/Botao';

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
    container: 'bg-ambar-50 dark:bg-amber-950/40 border-ambar-300 dark:border-amber-800',
    titulo: 'text-ambar-900 dark:text-amber-200',
    mensagem: 'text-ambar-800 dark:text-amber-300',
    iconePadrao: <AlertTriangle size={22} color="#b45309" />,
    botaoVariante: 'aviso' as const,
  },
  alerta: {
    container: 'bg-alerta-50 dark:bg-red-950/40 border-alerta-300 dark:border-red-800',
    titulo: 'text-alerta-900 dark:text-red-200',
    mensagem: 'text-alerta-800 dark:text-red-300',
    iconePadrao: <AlertCircle size={22} color="#b91c1c" />,
    botaoVariante: 'perigo' as const,
  },
  sucesso: {
    container: 'bg-pasto-50 dark:bg-pasto-950/40 border-pasto-300 dark:border-pasto-800',
    titulo: 'text-pasto-900 dark:text-pasto-200',
    mensagem: 'text-pasto-800 dark:text-pasto-300',
    iconePadrao: <CheckCircle2 size={22} color="#1b4332" />,
    botaoVariante: 'sucesso' as const,
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800',
    titulo: 'text-blue-900 dark:text-blue-200',
    mensagem: 'text-blue-800 dark:text-blue-300',
    iconePadrao: <Info size={22} color="#1d4ed8" />,
    botaoVariante: 'secundario' as const,
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
      className={`rounded-2xl border p-4 shadow-sm ${estilo.container} ${className}`}
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar alerta"
            onPress={onFechar}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="p-1 rounded-full active:bg-black/5 dark:active:bg-white/10"
          >
            <X size={18} color="#6b7280" />
          </Pressable>
        )}
      </View>

      {textoAcao && onAcao && (
        <View className="mt-3 flex-row justify-end">
          <Botao
            titulo={textoAcao}
            onPress={onAcao}
            variante={estilo.botaoVariante}
            tamanho="sm"
          />
        </View>
      )}
    </View>
  );
}

