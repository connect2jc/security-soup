import type { AuditCheck } from "../types";
import AuditCard from "./AuditCard";

export default function AuditTab({ audit }: { audit: AuditCheck[] }) {
  const criticalAudits = audit.filter((c) => !c.passed && c.severity === "critical");
  const warnAudits = audit.filter((c) => !c.passed && c.severity !== "critical");
  const passedAudits = audit.filter((c) => c.passed);
  const auditPassed = passedAudits.length;
  const auditTotal = audit.length;

  return (
    <div className="anim-fadeInUp">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Security Audit</h2>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-lg tabular-nums"
          style={{
            background: auditPassed === auditTotal ? "rgba(34, 197, 94, 0.15)" : "var(--badge-bg)",
            color: auditPassed === auditTotal ? "#22c55e" : "var(--text-muted)",
          }}
        >
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

      {/* Critical audit failures */}
      {criticalAudits.length > 0 && (
        <div className="space-y-2 mb-4">
          {criticalAudits.map((check, i) => (
            <AuditCard key={check.id} check={check} index={i} variant="critical" />
          ))}
        </div>
      )}

      {/* Warnings */}
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
}
