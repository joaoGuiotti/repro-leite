/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Tema único do app: nenhuma tela usa cor solta.
      colors: {
        pasto: {
          50: '#f1f8f4',
          100: '#d8efe0',
          200: '#b3dfc3',
          500: '#2d6a4f',
          700: '#1f4f3a',
          900: '#1b4332',
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
