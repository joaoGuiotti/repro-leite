import React from 'react';
import {
  Modal as RNModal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';

export interface ModalPadraoProps {
  visivel: boolean;
  onFechar: () => void;
  titulo?: string;
  subtitulo?: string;
  iconeTitulo?: React.ReactNode;
  /** Exibe botão 'X' de fechar no topo. Padrão: true se houver titulo */
  mostrarBotaoFechar?: boolean;
  /** Se tocar fora do card fecha o modal. Padrão: true */
  fecharAoTocarFundo?: boolean;
  /** Limite de largura do card: 'max-w-sm' | 'max-w-md' | 'max-w-lg'. Padrão: 'max-w-md' */
  larguraMaxima?: string;
  /** Tipo de animação. Padrão: 'fade' */
  tipoAnimacao?: 'fade' | 'slide' | 'none';
  /** Classes extras para estilizar o card interno */
  classNameCard?: string;
  /** Classes extras para o container de conteúdo */
  classNameConteudo?: string;
  /** Conteúdo principal do modal */
  children: React.ReactNode;
  /** Rodapé opcional com botões de ação fixos */
  rodape?: React.ReactNode;
}

export function ModalPadrao({
  visivel,
  onFechar,
  titulo,
  subtitulo,
  iconeTitulo,
  mostrarBotaoFechar,
  fecharAoTocarFundo = true,
  larguraMaxima = 'max-w-md',
  tipoAnimacao = 'fade',
  classNameCard = '',
  classNameConteudo,
  children,
  rodape,
}: ModalPadraoProps) {
  const exibirBotaoFechar =
    mostrarBotaoFechar !== undefined ? mostrarBotaoFechar : !!titulo;

  return (
    <RNModal
      visible={visivel}
      animationType={tipoAnimacao}
      transparent={true}
      onRequestClose={onFechar}
    >
      <View className="flex-1 justify-center items-center bg-black/60 p-4">
        {/* Backdrop para fechar ao tocar fora */}
        {fecharAoTocarFundo && (
          <Pressable
            className="absolute inset-0"
            onPress={onFechar}
            accessibilityLabel="Fechar modal tocando fora"
          />
        )}

        {/* Card Branco Padronizado com cantos arredondados e sombra */}
        <View
          className={`w-full ${larguraMaxima} max-h-[90%] rounded-3xl bg-white p-5 shadow-2xl ${classNameCard}`}
        >
          {/* Topo / Cabeçalho Opcional */}
          {(titulo || exibirBotaoFechar) && (
            <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-gray-100">
              <View className="flex-1 mr-3 flex-row items-center gap-2">
                {iconeTitulo}
                <View className="flex-1">
                  {titulo && (
                    <Text className="text-xl font-black text-gray-900">
                      {titulo}
                    </Text>
                  )}
                  {subtitulo && (
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {subtitulo}
                    </Text>
                  )}
                </View>
              </View>

              {exibirBotaoFechar && (
                <TouchableOpacity
                  onPress={onFechar}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  accessibilityLabel="Fechar formulário"
                  accessibilityRole="button"
                  className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
                >
                  <X size={18} color="#4b5563" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Conteúdo Central */}
          {classNameConteudo ? (
            <View className={classNameConteudo}>{children}</View>
          ) : (
            children
          )}

          {/* Rodapé Fixo Opcional */}
          {rodape && (
            <View className="pt-3 mt-2 border-t border-gray-100">{rodape}</View>
          )}
        </View>
      </View>
    </RNModal>
  );
}

export const Modal = ModalPadrao;
export default ModalPadrao;
