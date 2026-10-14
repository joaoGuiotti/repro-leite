import { Colors, TailwindColors, ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface AppTheme {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  tailwind: typeof TailwindColors;
  primary: string;
  textSecondary: string;
  text: string;
  background: string;
}

export function useTheme() {
  const scheme = useColorScheme();
  const activeScheme: 'light' | 'dark' = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[activeScheme];

  const appTheme: AppTheme = {
    scheme: activeScheme,
    colors,
    tailwind: TailwindColors,
    primary: colors.primary,
    textSecondary: colors.textSecondary,
    text: colors.text,
    background: colors.background,
  };

  return {
    ...appTheme,
    theme: appTheme,
  };
}

export default useTheme;
