import { Moon, Sun } from "phosphor-react";
import { useTheme } from "@/contexts/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none ${
        isDark ? "" : "border-2"
      }`}
      style={{
        backgroundColor: isDark ? "var(--bg-tertiary)" : "var(--bg-secondary)",
        borderColor: isDark ? "transparent" : "var(--border-primary)",
      }}
      aria-label={`Alternar para tema ${isDark ? "claro" : "escuro"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full shadow-lg transition-transform duration-300 ease-in-out flex items-center justify-center border ${
          isDark ? "translate-x-6" : "translate-x-1"
        }`}
        style={{
          backgroundColor: isDark ? "var(--accent-gold)" : "#ffffff",
          borderColor: "#000000",
        }}
      >
        {isDark ? (
          <Moon
            size={12}
            weight="fill"
            style={{ color: "var(--bg-primary)" }}
          />
        ) : (
          <Sun
            size={12}
            weight="fill"
            style={{ color: "var(--accent-amber)" }}
          />
        )}
      </span>
    </button>
  );
}

