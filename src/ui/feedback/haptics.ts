import * as Haptics from 'expo-haptics';

/**
 * Utilitário seguro para feedback tátil via expo-haptics.
 * Falha silenciosamente em plataformas não suportadas (ex: Web ou Emulador).
 */
export const hapticFeedback = {
  success: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // noop
    }
  },
  warning: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // noop
    }
  },
  error: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // noop
    }
  },
  selection: async () => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // noop
    }
  },
  impact: async (style: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      const styles = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      await Haptics.impactAsync(styles[style]);
    } catch {
      // noop
    }
  },
};
