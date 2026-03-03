import type { Severity } from "../types";

const styles: Record<Severity, { bg: string; text: string; glow: string; dot: string }> = {
  critical: { bg: "bg-red-500/15", text: "text-red-400", glow: "shadow-red-500/20", dot: "bg-red-400" },
  high:     { bg: "bg-orange-500/15", text: "text-orange-400", glow: "shadow-orange-500/20", dot: "bg-orange-400" },
  medium:   { bg: "bg-yellow-500/15", text: "text-yellow-400", glow: "shadow-yellow-500/20", dot: "bg-yellow-400" },
  low:      { bg: "bg-blue-500/15", text: "text-blue-400", glow: "shadow-blue-500/20", dot: "bg-blue-400" },
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const s = styles[severity];
  return (
    <span className={`${s.bg} ${s.text} text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm ${s.glow}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${severity === "critical" ? "animate-pulse" : ""}`} />
      {severity}
    </span>
  );
}
