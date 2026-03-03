import { useState } from "react";
import type { Finding, Severity } from "../types";
import FindingCard from "./FindingCard";

type Filter = "all" | Severity;

const filterConfig: { key: Filter; label: string; color: string; activeBg: string }[] = [
  { key: "all", label: "All", color: "text-slate-300", activeBg: "bg-slate-600/50 text-white" },
  { key: "critical", label: "Critical", color: "text-red-400", activeBg: "bg-red-500/20 text-red-300 ring-1 ring-red-500/30" },
  { key: "high", label: "High", color: "text-orange-400", activeBg: "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30" },
  { key: "medium", label: "Medium", color: "text-yellow-400", activeBg: "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30" },
  { key: "low", label: "Low", color: "text-blue-400", activeBg: "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30" },
];

export default function FindingsList({ findings }: { findings: Finding[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all" ? findings : findings.filter((f) => f.severity === filter);

  const counts = {
    all: findings.length,
    critical: findings.filter((f) => f.severity === "critical").length,
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filterConfig.map((f) => {
          const isActive = filter === f.key;
          const count = counts[f.key];
          if (f.key !== "all" && count === 0) return null;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                isActive ? f.activeBg : ""
              }`}
              style={isActive ? {} : { background: "var(--badge-bg)", color: "var(--text-muted)" }}
            >
              {f.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? "bg-white/10" : ""}`}
                style={isActive ? {} : { background: "var(--border-secondary)" }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p style={{ color: "var(--text-muted)" }}>No findings match this filter.</p>
          </div>
        ) : (
          filtered.map((f, i) => <FindingCard key={f.id} finding={f} index={i} />)
        )}
      </div>
    </div>
  );
}
