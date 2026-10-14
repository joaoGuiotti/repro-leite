import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  Heart,
  Milk,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  Syringe,
  Tag,
  TriangleAlert,
  Users,
  WifiOff,
  X,
} from 'lucide-react-native';
import { registerIconInterop } from './primitives/Icon';

/**
 * Mapa centralizado de ícones de domínio para garantir consistência visual no app.
 * Conforme Regra 7 do projeto (project-architecture.md).
 */
export const AppIcons = {
  // Domínio Zootécnico
  insemination: Syringe,
  herd: Milk,
  herdGroup: Users,
  bulls: Shield,
  calves: Heart,
  alert: TriangleAlert,
  earTag: Tag,
  calendar: Calendar,
  clock: Clock,
  sparkles: Sparkles,

  // Sincronização & Rede
  sync: RefreshCw,
  offline: WifiOff,

  // Ações & Navegação
  search: Search,
  filter: Filter,
  add: Plus,
  close: X,
  back: ArrowLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  settings: Settings,

  // Feedback & Status
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
} as const;

export type AppIconName = keyof typeof AppIcons;

// Registra previamente todos os ícones de domínio no NativeWind cssInterop
for (const icon of Object.values(AppIcons)) {
  registerIconInterop(icon as unknown as Parameters<typeof registerIconInterop>[0]);
}

