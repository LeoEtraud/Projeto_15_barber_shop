import { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeProvider";

/**
 * Hook otimizado para gerenciar tema do header
 * Retorna estilos e classes baseados no tema atual
 */
export function useHeaderTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const styles = useMemo(() => {
    if (isDark) {
      return {
        "--header-bg": "#1f1f1f",
        "--header-border": "#3a3a3a",
        "--header-text-primary": "#f5f5f5",
        "--header-text-secondary": "#d4d4d4",
        "--header-hover": "#2f2f2f",
        "--header-accent": "#d4af37",
      } as React.CSSProperties;
    }
    return {
      "--header-bg": "#ffffff",
      "--header-border": "#e5e5e5",
      "--header-text-primary": "#1a1a1a",
      "--header-text-secondary": "#404040",
      "--header-hover": "#f0f0f0",
      "--header-accent": "#b8860b",
    } as React.CSSProperties;
  }, [isDark]);

  const classes = useMemo(() => {
    return {
      header: "w-full flex items-center justify-between px-3 py-2 border-b sticky top-0 z-50 transition-colors duration-300 shadow-sm",
      textPrimary: "font-semibold text-base transition-colors duration-300",
      textSecondary: "text-xs leading-tight transition-colors duration-300",
      border: "border-1 rounded-lg transition-colors duration-300",
      hover: "transition-colors duration-300",
    };
  }, []);

  return {
    theme,
    isDark,
    styles,
    classes,
  };
}

