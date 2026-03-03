import type { ScanResult } from "../types";
import ScoreGauge from "./ScoreGauge";
import SeverityBar from "./SeverityBar";
import MetricCard from "./MetricCard";
import { AlertTriangle, Search, ClipboardCheck, Globe, ChevronRight, Check } from "./Icons";
import type { TabId } from "./DashboardTabs";

export default function OverviewTab({
  result,
  onTabChange,
}: {
  result: ScanResult;
  onTabChange: (tab: TabId) => void;
}) {
  const critical = result.findings.filter((f) => f.severity === "critical").length;
  const high = result.findings.filter((f) => f.severity === "high").length;
  const medium = result.findings.filter((f) => f.severity === "medium").length;
  const low = result.findings.filter((f) => f.severity === "low").length;
  const auditPassed = result.audit.filter((c) => c.passed).length;
  const auditTotal = result.audit.length;
  const providers = new Set(result.findings.map((f) => f.provider)).size;

  const criticalFindings = result.findings.filter((f) => f.severity === "critical").slice(0, 3);
  const criticalAudits = result.audit.filter((c) => !c.passed && c.severity === "critical");

  const scoreMessage =
    result.score >= 90
      ? "Your security posture is excellent."
      : result.score >= 70
        ? "Your security posture is good with some areas to improve."
        : result.score >= 50
          ? "Your security posture needs improvement."
          : "Your security posture needs immediate attention.";

  return (
    <div className="space-y-6 anim-fadeInUp">
      {/* Score Hero */}
      <div
        className="glass rounded-2xl p-8"
      >
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <ScoreGauge score={result.score} label={result.scoreLabel} />
          </div>

          <div className="flex-1 w-full space-y-5">
            <div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-4xl font-black tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {result.score}
                </span>
                <span className="text-lg font-bold" style={{ color: "var(--text-muted)" }}>/100</span>
                <span className="text-sm font-bold uppercase tracking-wider" style={{
                  color: result.score >= 70 ? "#22c55e" : result.score >= 50 ? "#eab308" : "#ef4444"
                }}>
                  {result.scoreLabel}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{scoreMessage}</p>
            </div>

            <SeverityBar critical={critical} high={high} medium={medium} low={low} />

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Critical" value={critical} color="#ef4444" maxVal={Math.max(critical, high, medium, low, 1)} delay={200} />
              <MetricCard label="High" value={high} color="#f97316" maxVal={Math.max(critical, high, medium, low, 1)} delay={300} />
              <MetricCard label="Medium" value={medium} color="#eab308" maxVal={Math.max(critical, high, medium, low, 1)} delay={400} />
              <MetricCard label="Low" value={low} color="#3b82f6" maxVal={Math.max(critical, high, medium, low, 1)} delay={500} />
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div className="mt-6 pt-5 flex items-center gap-6 flex-wrap" style={{ borderTop: "1px solid var(--border-secondary)" }}>
          <SummaryItem icon={<Search size={14} />} label="Findings" value={result.findings.length} />
          <SummaryItem icon={<ClipboardCheck size={14} />} label="Audit" value={`${auditPassed}/${auditTotal}`} />
          <SummaryItem icon={<Globe size={14} />} label="Providers" value={providers} />
        </div>
      </div>

      {/* Critical Findings Preview */}
      {criticalFindings.length > 0 && (
        <div
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Requires Immediate Attention
            </h3>
            <button
              onClick={() => onTabChange("findings")}
              className="text-xs font-semibold flex items-center gap-1 transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {criticalFindings.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-3 rounded-lg border-l-[3px] border-l-red-500/40"
                style={{ background: "var(--bg-inset)", border: "1px solid var(--border-secondary)", borderLeft: "3px solid rgba(239, 68, 68, 0.4)" }}
              >
                <span className="text-red-400 flex-shrink-0">
                  <AlertTriangle size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {f.description || f.patternId}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    {f.file}:{f.line}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase text-red-400 bg-red-500/15 px-2 py-0.5 rounded">
                  Critical
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Failures Preview */}
      {result.audit.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Audit Failures
            </h3>
            <button
              onClick={() => onTabChange("audit")}
              className="text-xs font-semibold flex items-center gap-1 transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {criticalAudits.slice(0, 3).map((check) => (
              <div
                key={check.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: "var(--bg-inset)", border: "1px solid var(--border-secondary)" }}
              >
                <span className="text-red-400 flex-shrink-0">
                  <AlertTriangle size={14} />
                </span>
                <p className="text-sm font-medium flex-1" style={{ color: "var(--text-primary)" }}>
                  {check.name}
                </p>
                <span className="text-[10px] font-bold uppercase text-red-400 bg-red-500/15 px-2 py-0.5 rounded">
                  Critical
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <Check size={12} className="text-green-400" />
            <span>{auditPassed} of {auditTotal} checks passed</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "var(--text-muted)" }}>{icon}</span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-lg font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}
