/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      // Tema semântico do app: nenhuma tela usa cor solta.
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          dark: '#0f172a',
          variant: '#f8fafc',
          'variant-dark': '#1e293b',
          border: '#e2e8f0',
          'border-dark': '#334155',
        },
        'on-surface': {
          DEFAULT: '#0f172a',
          dark: '#f8fafc',
          muted: '#64748b',
          'muted-dark': '#94a3b8',
        },
        danger: {
          DEFAULT: '#dc2626',
          light: '#fee2e2',
          dark: '#ef4444',
        },
        warning: {
          DEFAULT: '#d97706',
          light: '#fef3c7',
          dark: '#f59e0b',
        },
        success: {
          DEFAULT: '#16a34a',
          light: '#dcfce7',
          dark: '#22c55e',
        },
        'sync-pending': {
          DEFAULT: '#d97706',
          light: '#fef3c7',
        },
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
      },
    },
  },
  plugins: [],
};
