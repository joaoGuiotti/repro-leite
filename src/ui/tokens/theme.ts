/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const TailwindColors = {
  pasto: {
    50: '#f1f8f4',
    100: '#d8efe0',
    200: '#b3dfc3',
    300: '#90d1a4',
    350: '#6dc284',
    400: '#4baf65',
    500: '#2d6a4f',
    600: '#285f46',
    700: '#1f4f3a',
    800: '#1b4332',
    900: '#17382a',
    950: '#132e24',
  },
  terra: {
    50: '#faf5ef',
    100: '#efe3d2',
    500: '#8b5e3c',
    700: '#5e3d25',
  },
  ambar: {
    100: '#fdecc8',
    500: '#e09f1f',
    700: '#8a5a00',
  },
  alerta: {
    100: '#fde2e2',
    700: '#9b1c1c',
  },
  celeste: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    500: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
} as const;

export const Colors = {
  light: {
    primary: TailwindColors.pasto[700],
    primaryDark: TailwindColors.pasto[900],
    primaryLight: TailwindColors.pasto[500],
    text: '#111827',
    textSecondary: '#6b7280',
    background: '#ffffff',
    backgroundElement: '#f3f4f6',
    backgroundSelected: '#f1f8f4',
    border: '#e5e7eb',
    ...TailwindColors,
  },
  dark: {
    primary: '#2d6a4f',
    primaryDark: '#1b4332',
    primaryLight: '#b3dfc3',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    background: '#111827',
    backgroundElement: '#1f2937',
    backgroundSelected: '#1f4f3a',
    border: '#374151',
    ...TailwindColors,
  },
} as const;

export type ThemeColors = typeof Colors.light | typeof Colors.dark;
export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
