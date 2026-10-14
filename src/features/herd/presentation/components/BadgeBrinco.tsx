import React from 'react';
import { Text, View } from 'react-native';

export interface BadgeBrincoProps {
  numero: string | number;
  rotulo?: string;
  tamanho?: 'sm' | 'md' | 'lg';
  variante?: 'padrao' | 'destaque' | 'inativo';
  className?: string;
}

/**
 * Componente reutilizável para exibição visual do Brinco do animal em listas e cabeçalhos.
 * Proporciona identificação rápida e alto contraste no manejo do curral.
 */
export function BadgeBrinco({
  numero,
  rotulo = 'BRINCO',
  tamanho = 'md',
  variante = 'padrao',
  className = '',
}: BadgeBrincoProps) {
  const configsTamanho = {
    sm: {
      caixa: 'min-w-[44px] min-h-[42px] px-1.5 py-1 rounded-xl',
      rotulo: 'text-[8px]',
      numero: 'text-sm',
    },
    md: {
      caixa: 'min-w-[54px] min-h-[50px] px-2 py-1.5 rounded-2xl',
      rotulo: 'text-[9px]',
      numero: 'text-lg',
    },
    lg: {
      caixa: 'min-w-[64px] min-h-[58px] px-2.5 py-2 rounded-2xl',
      rotulo: 'text-[10px]',
      numero: 'text-2xl',
    },
  }[tamanho];

  const configsVariante = {
    padrao: {
      caixa: 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs',
      rotulo: 'text-slate-400 dark:text-slate-500',
      numero: 'text-gray-950 dark:text-slate-100',
    },
    destaque: {
      caixa: 'bg-pasto-50 dark:bg-pasto-950/60 border border-pasto-300 dark:border-pasto-800 shadow-xs',
      rotulo: 'text-pasto-700 dark:text-pasto-400',
      numero: 'text-pasto-950 dark:text-pasto-200',
    },
    inativo: {
      caixa: 'bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 shadow-xs',
      rotulo: 'text-amber-600/70 dark:text-amber-400/70',
      numero: 'text-amber-950 dark:text-amber-300',
    },
  }[variante];

  return (
    <View
      className={`items-center justify-center ${configsTamanho.caixa} ${configsVariante.caixa} ${className}`}
    >
      {rotulo ? (
        <Text
          className={`font-black uppercase tracking-wider ${configsTamanho.rotulo} ${configsVariante.rotulo}`}
          numberOfLines={1}
        >
          {rotulo}
        </Text>
      ) : null}
      <Text
        className={`font-black tracking-tight leading-tight ${configsTamanho.numero} ${configsVariante.numero}`}
        numberOfLines={1}
      >
        {numero}
      </Text>
    </View>
  );
}

export const TagBrinco = BadgeBrinco;
export default BadgeBrinco;
