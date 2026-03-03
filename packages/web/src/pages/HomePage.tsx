import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ScanButton from "../components/ScanButton";
import StatusBar from "../components/StatusBar";
import ThemeToggle from "../components/ThemeToggle";
import { runScan } from "../api";
import type { ScanResult } from "../types";
import { Shield, CheckCircle, Lock, Wrench } from "../components/Icons";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "scanning" | "done" | "error">(
    "idle"
  );
  const [customPath, setCustomPath] = useState("");
  const navigate = useNavigate();

  const handleScan = async () => {
    setLoading(true);
    setStatus("scanning");
    try {
      const result: ScanResult = await runScan(customPath || undefined);
      setStatus("done");
      navigate("/results", { state: { result } });
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Theme toggle in top-right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-lg w-full text-center space-y-10 relative z-10">
        {/* Logo/Brand */}
        <div className="space-y-3">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)" }}
          >
            <Shield size={32} className="text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
            SecureSecrets
          </h1>
          <p className="text-lg max-w-sm mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Find exposed API keys, tokens, and secrets on your machine before someone else does.
          </p>
        </div>

        {/* Main CTA */}
        <ScanButton onClick={handleScan} loading={loading} />

        {/* Custom path */}
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Or scan a specific folder:
          </p>
          <input
            type="text"
            placeholder="/path/to/your/project"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <StatusBar status={status} />

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <FeatureCard
            icon={<CheckCircle size={20} className="text-green-400" />}
            title="24 Patterns"
            desc="Detects all major providers"
          />
          <FeatureCard
            icon={<Lock size={20} className="text-purple-400" />}
            title="100% Local"
            desc="Nothing leaves your machine"
          />
          <FeatureCard
            icon={<Wrench size={20} className="text-yellow-400" />}
            title="Fix Guides"
            desc="Step-by-step remediation"
          />
        </div>

        <p className="text-xs pb-4" style={{ color: "var(--text-muted)" }}>
          Everything stays on your computer. No data is sent anywhere.
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-secondary)",
      }}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{title}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
    </div>
  );
}
