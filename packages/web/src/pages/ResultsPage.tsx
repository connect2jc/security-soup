import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
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

  const critical = result.findings.filter((f) => f.severity === "critical").length;
  const high = result.findings.filter((f) => f.severity === "high").length;
  const medium = result.findings.filter((f) => f.severity === "medium").length;
  const low = result.findings.filter((f) => f.severity === "low").length;
  const auditPassed = result.audit.filter((c) => c.passed).length;
  const auditTotal = result.audit.length;

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "securesecrets-report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen px-4 py-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none anim-orbFloat"
        style={{ background: `radial-gradient(circle, ${result.score >= 50 ? "rgba(59,130,246,0.06)" : "rgba(239,68,68,0.06)"} 0%, transparent 70%)` }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[80px] pointer-events-none anim-orbFloat2"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)" }} />

      <div className="max-w-4xl mx-auto relative z-10">

        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8 anim-fadeInDown">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Security Report</h1>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="group px-5 py-2.5 text-sm font-semibold bg-slate-800/50 hover:bg-slate-700/60 rounded-xl border border-slate-700/50 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 backdrop-blur-sm flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 group-hover:text-blue-400 transition-colors">
              <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
            </svg>
            Scan Again
          </button>
        </div>

        {/* ─── Score Hero Section ─────────────────────────────── */}
        <div className="glass rounded-2xl p-8 mb-6 anim-fadeInUp relative overflow-hidden">
          {/* Shimmer overlay */}
          <div className="absolute inset-0 anim-shimmer pointer-events-none rounded-2xl" />

          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Gauge */}
            <div className="flex-shrink-0">
              <ScoreGauge score={result.score} label={result.scoreLabel} />
            </div>

            {/* Metrics grid */}
            <div className="flex-1 w-full grid grid-cols-2 gap-3">
              <MetricCard
                label="Critical"
                value={critical}
                color="#ef4444"
                maxVal={Math.max(critical, high, medium, low, 1)}
                delay={200}
              />
              <MetricCard
                label="High"
                value={high}
                color="#f97316"
                maxVal={Math.max(critical, high, medium, low, 1)}
                delay={300}
              />
              <MetricCard
                label="Medium"
                value={medium}
                color="#eab308"
                maxVal={Math.max(critical, high, medium, low, 1)}
                delay={400}
              />
              <MetricCard
                label="Low"
                value={low}
                color="#3b82f6"
                maxVal={Math.max(critical, high, medium, low, 1)}
                delay={500}
              />
            </div>
          </div>

          {/* Summary strip */}
          <div className="mt-6 pt-5 border-t border-slate-700/20 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <SummaryItem label="Total Findings" value={result.findings.length} />
              <SummaryItem label="Audit Checks" value={`${auditPassed}/${auditTotal}`} />
              <SummaryItem label="Providers" value={new Set(result.findings.map((f) => f.provider)).size} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadJson}
                className="px-4 py-2 text-xs font-semibold bg-slate-700/40 hover:bg-slate-600/50 rounded-lg border border-slate-600/30 transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* ─── Findings Section ───────────────────────────────── */}
        {result.findings.length > 0 ? (
          <div className="anim-fadeInUp" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold tracking-tight">Findings</h2>
              <span className="text-xs font-bold bg-slate-700/50 px-2.5 py-1 rounded-lg text-slate-400 tabular-nums">
                {result.findings.length}
              </span>
            </div>
            <FindingsList findings={result.findings} />
          </div>
        ) : (
          <div className="anim-fadeInUp glass rounded-2xl p-12 text-center" style={{ animationDelay: "300ms" }}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-5 anim-checkPop" style={{ animationDelay: "600ms" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p className="text-green-400 text-2xl font-bold">All Clear</p>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">No exposed secrets found. Your setup is looking clean.</p>
          </div>
        )}

        {/* ─── Audit Section ──────────────────────────────────── */}
        {result.audit.length > 0 && (() => {
          const criticalAudits = result.audit.filter((c) => !c.passed && c.severity === "critical");
          const warnAudits = result.audit.filter((c) => !c.passed && c.severity !== "critical");
          const passedAudits = result.audit.filter((c) => c.passed);

          return (
            <div className="mt-8 anim-fadeInUp" style={{ animationDelay: "500ms" }}>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-bold tracking-tight">Security Audit</h2>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg tabular-nums ${
                  auditPassed === auditTotal
                    ? "bg-green-500/15 text-green-400"
                    : "bg-slate-700/50 text-slate-400"
                }`}>
                  {auditPassed}/{auditTotal}
                </span>
                {criticalAudits.length > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400">
                    {criticalAudits.length} critical
                  </span>
                )}
                {warnAudits.length > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-400">
                    {warnAudits.length} warn
                  </span>
                )}
              </div>

              {/* Critical audit failures - full width */}
              {criticalAudits.length > 0 && (
                <div className="space-y-2 mb-4">
                  {criticalAudits.map((check, i) => (
                    <AuditCard key={check.id} check={check} index={i} variant="critical" />
                  ))}
                </div>
              )}

              {/* Warnings - full width */}
              {warnAudits.length > 0 && (
                <div className="space-y-2 mb-4">
                  {warnAudits.map((check, i) => (
                    <AuditCard key={check.id} check={check} index={i + criticalAudits.length} variant="warn" />
                  ))}
                </div>
              )}

              {/* Passed checks - compact 2-column grid */}
              {passedAudits.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {passedAudits.map((check, i) => (
                    <AuditCard key={check.id} check={check} index={i + criticalAudits.length + warnAudits.length} variant="pass" />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Bottom spacer */}
        <div className="h-12" />
      </div>
    </div>
  );
}


// ─── Metric Card ──────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  color,
  maxVal,
  delay,
}: {
  label: string;
  value: number;
  color: string;
  maxVal: number;
  delay: number;
}) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const timer = setTimeout(() => requestAnimationFrame(animate), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const barPercent = maxVal > 0 ? (value / maxVal) * 100 : 0;

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-slate-800/30 border border-slate-700/20 p-4 anim-fadeInScale"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: `${color}40` }} />
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-8 pointer-events-none" style={{ background: `linear-gradient(180deg, ${color}08 0%, transparent 100%)` }} />

      <div className="relative">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-black tabular-nums" style={{ color }}>
            {animated}
          </span>
          {value > 0 && (
            <span className="text-[10px] font-semibold text-slate-600 mb-1">issues</span>
          )}
        </div>

        {/* Mini bar */}
        <div className="mt-3 h-1 rounded-full bg-slate-700/30 overflow-hidden">
          <div
            className="h-full rounded-full anim-barGrow"
            style={{
              width: `${barPercent}%`,
              backgroundColor: color,
              animationDelay: `${delay + 400}ms`,
              boxShadow: `0 0 8px ${color}40`,
            }}
          />
        </div>
      </div>
    </div>
  );
}


// ─── Summary Item ─────────────────────────────────────────────────────

function SummaryItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-slate-300 tabular-nums">{value}</p>
    </div>
  );
}


// ─── Audit Card ───────────────────────────────────────────────────────

const severityIcon = {
  critical: { bg: "bg-red-500/15", text: "text-red-400", border: "border-l-red-500/40" },
  warn: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-l-orange-500/40" },
  pass: { bg: "bg-green-500/15", text: "text-green-400", border: "border-l-green-500/30" },
};

function AuditCard({
  check,
  index,
  variant,
}: {
  check: { id: string; name: string; passed: boolean; severity: string; description: string; recommendation: string };
  index: number;
  variant: "critical" | "warn" | "pass";
}) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const style = severityIcon[variant];

  // Multi-line description means this check has details worth expanding
  const hasDetails = !check.passed && (check.description.includes("\n") || check.description.length > 100);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [open]);

  return (
    <div
      className={`glass rounded-xl overflow-hidden transition-all anim-cardReveal ${
        !check.passed ? `border-l-[3px] ${style.border}` : ""
      } ${open ? "ring-1 ring-slate-600/30" : ""}`}
      style={{ animationDelay: `${600 + index * 80}ms` }}
    >
      <button
        onClick={() => hasDetails && setOpen(!open)}
        className={`w-full p-4 flex items-start gap-3 text-left ${hasDetails ? "group cursor-pointer" : "cursor-default"}`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
          {check.passed ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`${style.text} anim-checkPop`} style={{ animationDelay: `${700 + index * 80}ms` }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : variant === "critical" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`${style.text} anim-failShake`} style={{ animationDelay: `${700 + index * 80}ms` }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`${style.text}`}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {!check.passed && (
            <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text} mb-1 block`}>
              {variant === "critical" ? "CRITICAL" : "WARNING"}
            </span>
          )}
          <p className={`text-sm font-semibold ${check.passed ? "text-slate-300" : "text-slate-200"}`}>
            {check.name}
          </p>
          {!check.passed && !hasDetails && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{check.recommendation}</p>
          )}
          {!check.passed && hasDetails && !open && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
              {check.description.split("\n")[0]}
            </p>
          )}
        </div>
        {hasDetails && (
          <div className={`w-7 h-7 rounded-lg bg-slate-700/30 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${open ? "rotate-180 bg-slate-600/40" : "group-hover:bg-slate-700/50"}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        )}
      </button>

      {/* Expandable details */}
      {hasDetails && (
        <div
          className="overflow-hidden"
          style={{
            maxHeight: open ? contentHeight + 20 : 0,
            opacity: open ? 1 : 0,
            transition: "max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
          }}
        >
          <div ref={contentRef} className="px-4 pb-4 pt-1 border-t border-slate-700/20 space-y-3">
            {/* Description lines rendered as structured content */}
            <div className="bg-slate-900/60 rounded-lg px-3 py-2.5 space-y-1">
              {check.description.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (trimmed.startsWith("- ")) {
                  // Bullet point — could be a code location or context item
                  const isCodeRef = trimmed.includes(":") && (trimmed.includes(".js:") || trimmed.includes(".ts:") || trimmed.includes(".py:"));
                  return (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="text-slate-600 flex-shrink-0 mt-0.5">{"\u2022"}</span>
                      <span className={isCodeRef ? "text-amber-400/80 font-mono" : "text-slate-400"}>
                        {trimmed.slice(2)}
                      </span>
                    </div>
                  );
                }
                if (trimmed.startsWith("[") || trimmed === "") return null;
                return (
                  <p key={i} className="text-xs text-slate-400 leading-relaxed">
                    {trimmed}
                  </p>
                );
              })}
            </div>

            {/* Fix recommendation */}
            <div className="bg-slate-800/40 rounded-lg px-3 py-2.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fix</span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{check.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
