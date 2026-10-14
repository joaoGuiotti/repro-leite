import { Text, TextInput, View } from 'react-native';

interface Props {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  sufixo?: string;
}

/** Teclado numérico para brinco, litros e pesos. */
export function CampoNumerico({ rotulo, valor, onChange, sufixo }: Props) {
  return (
    <View>
      <Text className="mb-1 text-base font-semibold text-black">{rotulo}</Text>
      <View className="min-h-14 flex-row items-center rounded-xl border-2 border-pasto-500 bg-white px-4">
        <TextInput
          accessibilityLabel={rotulo}
          className="flex-1 text-xl text-black"
          keyboardType="numeric"
          inputMode="numeric"
          value={valor}
          onChangeText={onChange}
        />
        {sufixo ? <Text className="ml-2 text-lg text-terra-700">{sufixo}</Text> : null}
      </View>
    </View>
  );
}
