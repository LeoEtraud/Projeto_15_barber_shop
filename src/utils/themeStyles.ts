/**
 * Utilitários para aplicar estilos de tema usando variáveis CSS
 * Essas funções retornam objetos de estilo que podem ser usados com style={}
 */

export const themeStyles = {
  // Backgrounds
  bgPrimary: { backgroundColor: "var(--bg-primary)" },
  bgSecondary: { backgroundColor: "var(--bg-secondary)" },
  bgTertiary: { backgroundColor: "var(--bg-tertiary)" },
  bgCard: { backgroundColor: "var(--bg-card)" },
  bgHover: { backgroundColor: "var(--bg-hover)" },

  // Text colors
  textPrimary: { color: "var(--text-primary)" },
  textSecondary: { color: "var(--text-secondary)" },
  textTertiary: { color: "var(--text-tertiary)" },
  textMuted: { color: "var(--text-muted)" },

  // Borders
  borderPrimary: { borderColor: "var(--border-primary)" },
  borderSecondary: { borderColor: "var(--border-secondary)" },
  borderAccent: { borderColor: "var(--border-accent)" },

  // Accents
  accentGold: { color: "var(--accent-gold)" },
  accentAmber: { color: "var(--accent-amber)" },
  accentBronze: { color: "var(--accent-bronze)" },

  // Combined styles
  section: {
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
  },
  card: {
    backgroundColor: "var(--bg-card)",
    borderColor: "var(--border-primary)",
  },
} as const;

/**
 * Retorna classes Tailwind com variáveis CSS para uso em className
 * Útil para combinar com outras classes
 */
export const themeClasses = {
  bgPrimary: "bg-[var(--bg-primary)]",
  bgSecondary: "bg-[var(--bg-secondary)]",
  bgCard: "bg-[var(--bg-card)]",
  bgHover: "bg-[var(--bg-hover)]",
  textPrimary: "text-[var(--text-primary)]",
  textSecondary: "text-[var(--text-secondary)]",
  borderPrimary: "border-[var(--border-primary)]",
  borderSecondary: "border-[var(--border-secondary)]",
} as const;

