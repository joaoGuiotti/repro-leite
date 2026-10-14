import { Sparkles } from 'lucide-react-native';
import { Text, View } from 'react-native';

export interface PainelProjecaoZootecnicaProps {
  dataIA: string; // ISO YYYY-MM-DD
  retornoCioData: string; // YYYY-MM-DD
  toqueData: string; // YYYY-MM-DD
  partoPrevistoData: string; // YYYY-MM-DD
  secagemData: string; // YYYY-MM-DD
  className?: string;
}

function formatarDataBR(isoDate: string): string {
  if (!isoDate || typeof isoDate !== 'string') return '--/--/----';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function PainelProjecaoZootecnica({
  retornoCioData,
  toqueData,
  partoPrevistoData,
  secagemData,
  className = '',
}: PainelProjecaoZootecnicaProps) {
  return (
    <View className={`rounded-2xl border border-emerald-200/90 bg-[#f0fdf4] p-3.5 shadow-xs ${className}`}>
      {/* Cabeçalho de Cálculos Automáticos */}
      <View className="flex-row items-center gap-1.5 mb-2.5">
        <Sparkles size={16} color="#059669" />
        <Text className="text-xs font-black uppercase tracking-wider text-emerald-900">
          Cálculos automáticos para esta inseminação
        </Text>
      </View>

      {/* Grade de 3 Colunas com os Marcos Zootécnicos */}
      <View className="flex-row gap-2">
        {/* 1. OBSERVAR RETORNO DO CIO (+21 DIAS) */}
        <View className="flex-1 rounded-xl border border-gray-200/90 bg-white p-2.5 justify-between">
          <Text className="text-[10px] font-black uppercase text-[#9a3412] tracking-tight" numberOfLines={1}>
            1. RETORNO DO CIO (+21D)
          </Text>
          <Text className="text-base font-black text-gray-950 mt-1 mb-0.5">
            {formatarDataBR(retornoCioData)}
          </Text>
          <Text className="text-[10px] text-gray-500 leading-tight">
            Vigiar no curral se a vaca manifesta cio
          </Text>
        </View>

        {/* 2. EXAME DE TOQUE (+45 DIAS) */}
        <View className="flex-1 rounded-xl border border-gray-200/90 bg-white p-2.5 justify-between">
          <Text className="text-[10px] font-black uppercase text-[#1e40af] tracking-tight" numberOfLines={1}>
            2. EXAME DE TOQUE (+45D)
          </Text>
          <Text className="text-base font-black text-gray-950 mt-1 mb-0.5">
            {formatarDataBR(toqueData)}
          </Text>
          <Text className="text-[10px] text-gray-500 leading-tight">
            Diagnóstico veterinário de prenhez
          </Text>
        </View>

        {/* 3. PREVISÃO DE PARTO (+282 DIAS) */}
        <View className="flex-1 rounded-xl border border-gray-200/90 bg-white p-2.5 justify-between">
          <Text className="text-[10px] font-black uppercase text-[#166534] tracking-tight" numberOfLines={1}>
            3. PREVISÃO DE PARTO (+282D)
          </Text>
          <Text className="text-base font-black text-gray-950 mt-1 mb-0.5">
            {formatarDataBR(partoPrevistoData)}
          </Text>
          <Text className="text-[10px] text-gray-500 leading-tight">
            Secar a vaca em {formatarDataBR(secagemData)} (60d antes)
          </Text>
        </View>
      </View>
    </View>
  );
}
