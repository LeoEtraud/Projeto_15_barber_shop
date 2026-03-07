import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Dark - Barbearia Moderna
        barber: {
          // Cores principais dark
          dark: {
            bg: {
              primary: "#0a0a0a",      // Fundo principal (quase preto)
              secondary: "#1a1a1a",    // Fundo secund?rio
              tertiary: "#2a2a2a",     // Fundo terci?rio
              card: "#1f1f1f",         // Fundo de cards
              hover: "#2f2f2f",        // Hover states
            },
            text: {
              primary: "#f5f5f5",      // Texto principal (quase branco)
              secondary: "#d4d4d4",    // Texto secund?rio
              tertiary: "#a3a3a3",     // Texto terci?rio
              muted: "#737373",        // Texto desabilitado
            },
            accent: {
              gold: "#d4af37",         // Dourado cl?ssico
              amber: "#f59e0b",         // ÿÿmbar moderno
              bronze: "#cd7f32",       // Bronze elegante
            },
            border: {
              primary: "#3a3a3a",     // Bordas principais
              secondary: "#2a2a2a",   // Bordas secund?rias
              accent: "#d4af37",      // Bordas de destaque
            },
          },
          // Cores principais light
          light: {
            bg: {
              primary: "#fafafa",      // Fundo principal (branco suave)
              secondary: "#f5f5f5",    // Fundo secund?rio
              tertiary: "#e5e5e5",     // Fundo terci?rio
              card: "#ffffff",         // Fundo de cards
              hover: "#f0f0f0",        // Hover states
            },
            text: {
              primary: "#1a1a1a",      // Texto principal (quase preto)
              secondary: "#404040",    // Texto secund?rio
              tertiary: "#6b6b6b",     // Texto terci?rio
              muted: "#9ca3af",        // Texto desabilitado
            },
            accent: {
              gold: "#b8860b",         // Dourado mais escuro para contraste
              amber: "#d97706",        // ÿÿmbar mais escuro
              bronze: "#92400e",       // Bronze mais escuro
            },
            border: {
              primary: "#e5e5e5",     // Bordas principais
              secondary: "#d4d4d4",   // Bordas secund?rias
              accent: "#b8860b",      // Bordas de destaque
            },
          },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#2563eb",
              foreground: "#ffffff",
            },
          },
        },
      },
    }),
  ],
}
