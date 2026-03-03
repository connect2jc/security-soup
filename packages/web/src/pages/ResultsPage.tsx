import { useLocation, useNavigate } from "react-router-dom";
import type { ScanResult } from "../types";
import ScoreGauge from "../components/ScoreGauge";
import FindingsList from "../components/FindingsList";

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = (location.state as { result?: ScanResult })?.result;

  if (!result) {
    navigate("/");
    return null;
  }

  const critical = result.findings.filter(
    (f) => f.severity === "critical"
  ).length;
  const high = result.findings.filter((f) => f.severity === "high").length;
  const medium = result.findings.filter(
    (f) => f.severity === "medium"
  ).length;
  const low = result.findings.filter((f) => f.severity === "low").length;

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "securesecrets-report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen px-4 py-8 relative">
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/3 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Security Report</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-sm bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 transition-all backdrop-blur-sm"
          >
            Scan Again
          </button>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-b from-slate-800/80 to-slate-800/40 rounded-2xl p-10 text-center border border-slate-700/30 backdrop-blur-sm shadow-xl shadow-black/10">
          <ScoreGauge score={result.score} label={result.scoreLabel} />
          <div className="flex gap-3 justify-center mt-8 flex-wrap">
            <SummaryPill label="Critical" count={critical} variant="critical" />
            <SummaryPill label="High" count={high} variant="high" />
            <SummaryPill label="Medium" count={medium} variant="medium" />
            <SummaryPill label="Low" count={low} variant="low" />
          </div>
        </div>

        {/* Findings */}
        {result.findings.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">Findings</h2>
              <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded-full text-slate-400">
                {result.findings.length}
              </span>
            </div>
            <FindingsList findings={result.findings} />
          </div>
        ) : (
          <div className="bg-gradient-to-b from-green-900/20 to-green-900/5 border border-green-500/20 rounded-2xl p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-500/10 rounded-full mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p className="text-green-400 text-xl font-semibold">
              No secrets found!
            </p>
            <p className="text-green-500/60 mt-2">
              Your setup looks clean. Nice work keeping things secure.
            </p>
          </div>
        )}

        {/* Audit Checks */}
        {result.audit.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">Configuration Audit</h2>
              <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded-full text-slate-400">
                {result.audit.filter((c) => c.passed).length}/{result.audit.length} passed
              </span>
            </div>
            <div className="space-y-2">
              {result.audit.map((check) => (
                <div
                  key={check.id}
                  className={`rounded-xl p-4 flex items-start gap-3 border transition-colors ${
                    check.passed
                      ? "bg-slate-800/30 border-slate-700/30"
                      : "bg-red-900/5 border-red-500/10"
                  }`}
                >
                  <span
                    className={`text-lg font-bold mt-0.5 ${
                      check.passed ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {check.passed ? "\u2713" : "\u2717"}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{check.name}</p>
                    {!check.passed && (
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {check.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={downloadJson}
            className="px-5 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-sm font-medium border border-slate-700/50 transition-all backdrop-blur-sm flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download JSON Report
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryPill({
  label,
  count,
  variant,
}: {
  label: string;
  count: number;
  variant: "critical" | "high" | "medium" | "low";
}) {
  const styles = {
    critical: "bg-red-500/8 text-red-400 border-red-500/15",
    high: "bg-orange-500/8 text-orange-400 border-orange-500/15",
    medium: "bg-yellow-500/8 text-yellow-400 border-yellow-500/15",
    low: "bg-blue-500/8 text-blue-400 border-blue-500/15",
  };

  return (
    <div
      className={`px-4 py-2 rounded-full text-sm font-medium border ${styles[variant]}`}
    >
      {label}: {count}
    </div>
  );
}
