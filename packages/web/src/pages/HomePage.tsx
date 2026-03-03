import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ScanButton from "../components/ScanButton";
import StatusBar from "../components/StatusBar";
import { runScan } from "../api";
import type { ScanResult } from "../types";

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
      {/* Background decorative elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full text-center space-y-10 relative z-10">
        {/* Logo/Brand */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
            SecureSecrets
          </h1>
          <p className="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed">
            Find exposed API keys, tokens, and secrets on your machine before someone else does.
          </p>
        </div>

        {/* Main CTA */}
        <ScanButton onClick={handleScan} loading={loading} />

        {/* Custom path */}
        <div className="space-y-3">
          <p className="text-slate-500 text-sm">
            Or scan a specific folder:
          </p>
          <input
            type="text"
            placeholder="/path/to/your/project"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-600 transition-all backdrop-blur-sm"
          />
        </div>

        <StatusBar status={status} />

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <FeatureCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            }
            title="24 Patterns"
            desc="Detects all major providers"
          />
          <FeatureCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            }
            title="100% Local"
            desc="Nothing leaves your machine"
          />
          <FeatureCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
            }
            title="Fix Guides"
            desc="Step-by-step remediation"
          />
        </div>

        <p className="text-slate-600 text-xs pb-4">
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
    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 backdrop-blur-sm">
      <div className="mb-2">{icon}</div>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
  );
}
