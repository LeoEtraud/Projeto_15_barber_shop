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
        className="inline-block h-5 w-5 transform rounded-full shadow-lg transition-transform duration-300 ease-in-out flex items-center justify-center border"
        style={{
          transform: isDark ? "translateX(1.5rem)" : "translateX(0.25rem)",
          backgroundColor: "transparent",
          borderColor: "rgba(0,0,0,0.65)",
          borderWidth: "1px",
        }}
      >
        {isDark ? (
          <Sun
            size={14}
            weight="fill"
            className="drop-shadow-sm"
            style={{ color: "#eab308" }}
          />
        ) : (
          <Moon
            size={12}
            weight="fill"
            style={{ color: "var(--text-primary)" }}
          />
        )}
      </span>
    </button>
  );
}

