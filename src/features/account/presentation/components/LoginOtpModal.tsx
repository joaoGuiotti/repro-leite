import React, { useState, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Botao, Icon, ModalPadrao, hapticFeedback } from '@/ui';
import { Mail, KeyRound, ArrowRight, RotateCcw, Check } from 'lucide-react-native';
import { useAccount } from '../hooks/useAccount';
import { DEFAULT_FARM_ID } from '@/core/db';

export interface LoginOtpModalProps {
  visivel: boolean;
  onFechar: () => void;
  farmId?: string;
  onSucesso?: () => void;
}

export function LoginOtpModal({
  visivel,
  onFechar,
  farmId = DEFAULT_FARM_ID,
  onSucesso,
}: LoginOtpModalProps) {
  const { requestOtp, verifyOtp, error: authError } = useAccount();

  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [tempoRestante, setTempoRestante] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (tempoRestante > 0) {
      timer = setTimeout(() => {
        setTempoRestante((t) => t - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [tempoRestante]);

  const handleReset = () => {
    setEtapa('email');
    setCodigo('');
    setErroLocal(null);
    setCarregando(false);
  };

  const handleFechar = () => {
    handleReset();
    onFechar();
  };

  const handleEnviarEmail = async () => {
    if (!email || !email.includes('@')) {
      setErroLocal('Informe um endereço de e-mail válido.');
      return;
    }

    setErroLocal(null);
    setCarregando(true);

    try {
      await hapticFeedback.selection();
      const sucesso = await requestOtp(email);
      if (sucesso) {
        setEtapa('codigo');
        setTempoRestante(60);
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleVerificarCodigo = async () => {
    const cod = codigo.trim();
    if (cod.length < 6 || cod.length > 8) {
      setErroLocal('Digite o código recebido por e-mail.');
      return;
    }

    setErroLocal(null);
    setCarregando(true);

    try {
      await hapticFeedback.selection();
      const sucesso = await verifyOtp(email, cod, farmId);
      if (sucesso) {
        await hapticFeedback.success();
        handleFechar();
        if (onSucesso) onSucesso();
      }
    } finally {
      setCarregando(false);
    }
  };

  const mensagemErro = erroLocal || authError;

  return (
    <ModalPadrao
      visivel={visivel}
      onFechar={handleFechar}
      titulo="Entrar com Conta"
      subtitulo={
        etapa === 'email'
          ? 'Backup em nuvem e sincronização multi-dispositivo.'
          : `Código de verificação enviado para ${email}`
      }
      iconeTitulo={<Icon icon={Mail} size="md" className="text-pasto-700 dark:text-pasto-300" decorative />}
    >
      <View className="gap-4 py-2">
        {mensagemErro && (
          <View className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl p-3">
            <Text className="text-xs text-red-700 dark:text-red-300">{mensagemErro}</Text>
          </View>
        )}

        {etapa === 'email' ? (
          <View className="gap-3">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Digite seu e-mail:
            </Text>
            <View className="flex-row items-center bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2.5">
              <Icon icon={Mail} size="sm" className="text-gray-400 mr-2" decorative />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="seu.email@exemplo.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 text-base text-gray-900 dark:text-gray-100 py-1"
                editable={!carregando}
              />
            </View>

            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enviaremos um código de acesso. Não é necessário criar nem lembrar senhas.
            </Text>

            <View className="mt-2">
              <Botao
                titulo={carregando ? 'Enviando Código...' : 'Enviar Código OTP'}
                icone={<Icon icon={ArrowRight} size="sm" className="text-white" decorative />}
                onPress={handleEnviarEmail}
                variante="primario"
                desabilitado={carregando || !email}
              />
            </View>
          </View>
        ) : (
          <View className="gap-3">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Digite o código de verificação recebido:
            </Text>
            <View className="flex-row items-center bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2.5">
              <Icon icon={KeyRound} size="sm" className="text-gray-400 mr-2" decorative />
              <TextInput
                value={codigo}
                onChangeText={(val) => setCodigo(val.replace(/\D/g, '').slice(0, 8))}
                placeholder="00000000"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={8}
                className="flex-1 text-xl font-bold tracking-widest text-center text-pasto-900 dark:text-pasto-200 py-1"
                editable={!carregando}
              />
            </View>

            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {tempoRestante > 0
                  ? `Reenviar código em ${tempoRestante}s`
                  : 'Não recebeu o código?'}
              </Text>
              {tempoRestante === 0 && (
                <Botao
                  titulo="Reenviar"
                  onPress={handleEnviarEmail}
                  variante="fantasma"
                  tamanho="sm"
                  desabilitado={carregando}
                />
              )}
            </View>

            <View className="gap-2.5 mt-2">
              <Botao
                titulo={carregando ? 'Validando...' : 'Confirmar e Entrar'}
                icone={<Icon icon={Check} size="sm" className="text-white" decorative />}
                onPress={handleVerificarCodigo}
                variante="primario"
                desabilitado={carregando || codigo.length < 6 || codigo.length > 8}
              />
              <Botao
                titulo="Alterar E-mail"
                icone={<Icon icon={RotateCcw} size="sm" className="text-gray-600 dark:text-gray-300" decorative />}
                onPress={() => setEtapa('email')}
                variante="secundario"
                desabilitado={carregando}
              />
            </View>
          </View>
        )}
      </View>
    </ModalPadrao>
  );
}
