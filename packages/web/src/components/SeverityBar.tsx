interface SeverityBarProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

const segments: { key: keyof SeverityBarProps; color: string; label: string }[] = [
  { key: "critical", color: "#ef4444", label: "Critical" },
  { key: "high", color: "#f97316", label: "High" },
  { key: "medium", color: "#eab308", label: "Medium" },
  { key: "low", color: "#3b82f6", label: "Low" },
];

export default function SeverityBar(props: SeverityBarProps) {
  const total = props.critical + props.high + props.medium + props.low;
  if (total === 0) return null;

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden" style={{ background: "var(--border-secondary)" }}>
        {segments.map(({ key, color }) => {
          const pct = (props[key] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className="h-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          );
        })}
      </div>
      <div className="flex gap-4 mt-2 flex-wrap">
        {segments.map(({ key, color, label }) => {
          if (props[key] === 0) return null;
          return (
            <span key={key} className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {props[key]} {label.toLowerCase()}
            </span>
          );
        })}
      </div>
    </div>
  );
}
