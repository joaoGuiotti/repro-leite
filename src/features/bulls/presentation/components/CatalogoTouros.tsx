import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Minus, Plus, ShieldAlert } from 'lucide-react-native';
import { Botao, Cartao } from '@/ui';
import { BullRecord, CreateBullDTO } from '../../domain/bull.entity';
import { BadgeEstoqueDoses } from './BadgeEstoqueDoses';
import { ModalCadastroTouro } from './ModalCadastroTouro';

export interface CatalogoTourosProps {
  touros: BullRecord[];
  onCadastrarTouro: (dados: CreateBullDTO) => Promise<void>;
  onAjustarDoses: (touroId: string, delta: number) => Promise<void>;
  farmId: string;
}

export function CatalogoTouros({
  touros,
  onCadastrarTouro,
  onAjustarDoses,
  farmId,
}: CatalogoTourosProps) {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <View className="flex-1">
      {/* Botão de Ação Primária */}
      <View className="mb-4">
        <Botao
          titulo="Cadastrar Novo Touro"
          onPress={() => setModalAberto(true)}
          variante="primario"
          icone={<Plus size={18} color="#ffffff" />}
          principal
        />
      </View>

      {/* Lista de Touros */}
      {touros.length === 0 ? (
        <Cartao>
          <View className="items-center py-6">
            <ShieldAlert size={36} color="#9ca3af" className="mb-2" />
            <Text className="text-base font-bold text-gray-800">Nenhum touro cadastrado</Text>
            <Text className="mt-1 text-center text-xs text-gray-500">
              Cadastre reprodutores e controle o saldo de palhetas de sêmen disponíveis no botijão.
            </Text>
          </View>
        </Cartao>
      ) : (
        <View className="gap-3">
          {touros.map((touro) => {
            const semEstoque = touro.strawsInStock <= 0;

            return (
              <Cartao key={touro.id}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-black text-gray-950">{touro.name}</Text>
                    <Text className="text-xs text-gray-600">
                      Raça: <Text className="font-semibold text-gray-900">{touro.breed}</Text>
                      {touro.code ? ` · Palheta: ${touro.code}` : ''}
                    </Text>
                    {touro.notes ? (
                      <Text className="mt-1 text-xs italic text-gray-500">{touro.notes}</Text>
                    ) : null}
                  </View>

                  {/* Badge de Estoque */}
                  <BadgeEstoqueDoses saldoDoses={touro.strawsInStock} />
                </View>

                {/* Controles de Ajuste Rápido de Doses */}
                <View className="mt-4 flex-row items-center justify-between border-t border-gray-100 pt-3">
                  <Text className="text-xs font-semibold text-gray-600">
                    Ajustar doses no botijão:
                  </Text>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => onAjustarDoses(touro.id, -1)}
                      disabled={semEstoque}
                      accessibilityLabel={`Diminuir uma dose do touro ${touro.name}`}
                      className={`h-9 w-9 items-center justify-center rounded-lg border ${
                        semEstoque
                          ? 'border-gray-200 bg-gray-100 opacity-50'
                          : 'border-gray-300 bg-white active:bg-gray-100'
                      }`}
                    >
                      <Minus size={16} color="#374151" />
                    </TouchableOpacity>

                    <Text className="min-w-[28px] text-center text-base font-black text-gray-900">
                      {touro.strawsInStock}
                    </Text>

                    <TouchableOpacity
                      onPress={() => onAjustarDoses(touro.id, 1)}
                      accessibilityLabel={`Aumentar uma dose do touro ${touro.name}`}
                      className="h-9 w-9 items-center justify-center rounded-lg border border-pasto-700 bg-pasto-700 active:bg-pasto-800"
                    >
                      <Plus size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Cartao>
            );
          })}
        </View>
      )}

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
