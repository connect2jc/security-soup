import { useEffect, useState } from "react";

export default function MetricCard({
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
      className="relative rounded-xl overflow-hidden p-4 anim-fadeInScale"
      style={{
        animationDelay: `${delay}ms`,
        background: "var(--bg-card)",
        border: "1px solid var(--border-secondary)",
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: `${color}40` }} />
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-8 pointer-events-none" style={{ background: `linear-gradient(180deg, ${color}08 0%, transparent 100%)` }} />

      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-black tabular-nums" style={{ color }}>
            {animated}
          </span>
          {value > 0 && (
            <span className="text-[10px] font-semibold mb-1" style={{ color: "var(--text-muted)" }}>issues</span>
          )}
        </div>

        {/* Mini bar */}
        <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-secondary)" }}>
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
