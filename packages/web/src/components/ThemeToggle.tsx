import { useTheme } from "../lib/theme";
import { Sun, Moon } from "./Icons";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
      style={{
        background: "var(--tab-hover-bg)",
        color: "var(--text-secondary)",
      }}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
