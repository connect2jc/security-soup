import { useEffect, useState } from "react";

function gaugeColor(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#3b82f6";
  if (score >= 50) return "#eab308";
  if (score >= 25) return "#f97316";
  return "#ef4444";
}

function gaugeGradient(score: number): [string, string] {
  if (score >= 90) return ["#22c55e", "#4ade80"];
  if (score >= 70) return ["#3b82f6", "#60a5fa"];
  if (score >= 50) return ["#eab308", "#facc15"];
  if (score >= 25) return ["#f97316", "#fb923c"];
  return ["#ef4444", "#f87171"];
}

export default function ScoreGauge({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const radius = 80;
  const strokeWidth = 10;
  const viewSize = 200;
  const center = viewSize / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = gaugeColor(score);
  const [gradStart, gradEnd] = gaugeGradient(score);

  useEffect(() => {
    const start = performance.now();
    const duration = 1800;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    setTimeout(() => setRevealed(true), 300);
  }, [score]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 220, height: 220 }}>
      {/* SVG gauge */}
      <svg width="220" height="220" viewBox={`0 0 ${viewSize} ${viewSize}`}>
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="var(--gauge-track)" strokeWidth={strokeWidth}
        />

        {/* Tick marks */}
        {Array.from({ length: 40 }).map((_, i) => {
          const angle = (i / 40) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const inner = radius - strokeWidth / 2 - 3;
          const outer = radius - strokeWidth / 2 - (i % 5 === 0 ? 9 : 5);
          return (
            <line
              key={i}
              x1={center + Math.cos(rad) * inner}
              y1={center + Math.sin(rad) * inner}
              x2={center + Math.cos(rad) * outer}
              y2={center + Math.sin(rad) * outer}
              stroke={`rgba(100,116,139,${i % 5 === 0 ? 0.25 : 0.12})`}
              strokeWidth={i % 5 === 0 ? 1.5 : 0.5}
            />
          );
        })}

        {/* Animated arc */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="url(#scoreGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          filter="url(#gaugeGlow)"
          style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />

        {/* Endpoint dot */}
        {animatedScore > 0 && (() => {
          const angle = ((animatedScore / 100) * 360 - 90) * (Math.PI / 180);
          return (
            <circle
              cx={center + Math.cos(angle) * radius}
              cy={center + Math.sin(angle) * radius}
              r={5} fill={color}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          );
        })()}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-6xl font-black tabular-nums tracking-tight transition-all duration-700 ${revealed ? "anim-numberReveal" : "opacity-0"}`}
          style={{ color, textShadow: `0 0 30px ${color}44` }}
        >
          {animatedScore}
        </span>
        <span
          className={`text-sm font-semibold uppercase tracking-widest mt-1 transition-all duration-500 ${revealed ? "opacity-100 delay-300" : "opacity-0"}`}
          style={{ color: `${color}aa` }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
