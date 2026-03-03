import type { Severity } from "../types";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "./Icons";

const styles: Record<Severity, { bg: string; text: string; glow: string }> = {
  critical: { bg: "bg-red-500/15", text: "text-red-400", glow: "shadow-red-500/20" },
  high:     { bg: "bg-orange-500/15", text: "text-orange-400", glow: "shadow-orange-500/20" },
  medium:   { bg: "bg-yellow-500/15", text: "text-yellow-400", glow: "shadow-yellow-500/20" },
  low:      { bg: "bg-blue-500/15", text: "text-blue-400", glow: "shadow-blue-500/20" },
};

const icons: Record<Severity, React.ReactNode> = {
  critical: <AlertTriangle size={10} strokeWidth={2.5} />,
  high: <AlertCircle size={10} strokeWidth={2.5} />,
  medium: <Info size={10} strokeWidth={2.5} />,
  low: <CheckCircle size={10} strokeWidth={2.5} />,
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const s = styles[severity];
  return (
    <span className={`${s.bg} ${s.text} text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm ${s.glow}`}>
      {icons[severity]}
      {severity}
    </span>
  );
}
