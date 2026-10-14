import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
  ScrollView,
  StatusBar,
  View,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

export interface ScreenProps {
  children: ReactNode;
  /** Se deve envolver o conteúdo em um ScrollView (padrão: false para listas como FlashList) */
  scroll?: boolean;
  /** Header fixo fora do scroll */
  header?: ReactNode;
  /** Footer fixo fora do scroll */
  footer?: ReactNode;
  /** Borda segura do SafeArea (padrão: left, right; 'top' já é aplicado no RootLayout acima do CabecalhoStatusSimulador) */
  edges?: Edge[];
  /** Se ativa KeyboardAvoidingView (padrão: true no iOS) */
  keyboardAvoiding?: boolean;
  /** Classes extras para o container de tela */
  className?: string;
  /** Classes extras para o container de conteúdo do scroll */
  contentContainerClassName?: string;
  /** Controle de pull-to-refresh opcional */
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Identificador para testes */
  testID?: string;
}

/**
 * Container padrão de tela (Screen) conforme a seção 6 do guia arquitetural.
 * Padroniza SafeArea, KeyboardAvoidingView, scroll e suporte aos temas claro/escuro.
 */
export function Screen({
  children,
  scroll = false,
  header,
  footer,
  edges = ['left', 'right'],
  keyboardAvoiding = Platform.OS === 'ios',
  className = '',
  contentContainerClassName = 'p-4 pb-12 gap-4',
  refreshControl,
  testID,
}: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={contentContainerClassName}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 ${className}`}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={edges}
      className="flex-1 bg-surface-variant dark:bg-surface-dark"
      testID={testID}
    >
      <StatusBar barStyle="dark-content" />
      {header}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
      {footer}
    </SafeAreaView>
  );
}
