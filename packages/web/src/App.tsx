import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./lib/theme";
import HomePage from "./pages/HomePage";
import ResultsPage from "./pages/ResultsPage";

export default function App() {
  return (
    <ThemeProvider>
      <div
        className="min-h-screen transition-colors duration-200"
        style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}
