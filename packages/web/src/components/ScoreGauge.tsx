import { useEffect, useState, useRef } from "react";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const radius = 80;
  const strokeWidth = 10;
  const viewSize = 200;
  const center = viewSize / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = gaugeColor(score);
  const [gradStart, gradEnd] = gaugeGradient(score);

  // Animate score count-up
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

  // Particle effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 280 * dpr;
    canvas.height = 280 * dpr;
    ctx.scale(dpr, dpr);

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      life: number; maxLife: number; size: number; color: string;
    }
    const particles: Particle[] = [];

    const addParticle = () => {
      const angle = Math.random() * Math.PI * 2;
      const r = 88 + Math.random() * 12;
      particles.push({
        x: 140 + Math.cos(angle) * r,
        y: 140 + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -Math.random() * 1.2 - 0.3,
        life: 0,
        maxLife: 50 + Math.random() * 50,
        size: 1 + Math.random() * 2,
        color,
      });
    };

    let frame: number;
    const loop = () => {
      ctx.clearRect(0, 0, 280, 280);
      if (Math.random() < 0.25) addParticle();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [color]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 280, height: 280 }}>
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: 280, height: 280 }}
      />

      {/* Outer breathing glow */}
      <div
        className="absolute rounded-full anim-breathe"
        style={{
          width: 220, height: 220, top: 30, left: 30,
          "--breathe-color": `${color}22`,
        } as React.CSSProperties}
      />

      {/* SVG gauge */}
      <svg width="220" height="220" viewBox={`0 0 ${viewSize} ${viewSize}`} className="relative z-10">
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
          fill="none" stroke="rgba(51,65,85,0.4)" strokeWidth={strokeWidth}
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
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
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
