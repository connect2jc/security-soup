import type { Severity } from "../types";

const colors: Record<Severity, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`${colors[severity]} text-white text-xs font-bold px-2 py-0.5 rounded uppercase`}
    >
      {severity}
    </span>
  );
}
