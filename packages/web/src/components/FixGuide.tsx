import { useEffect, useState } from "react";
import { getFixSteps, type FixStep } from "../lib/fixes";
import { getPlatform, type Platform } from "../api";

export default function FixGuide({
  patternId,
  filePath,
}: {
  patternId: string;
  filePath: string;
}) {
  const [platform, setPlatform] = useState<Platform>("darwin");

  useEffect(() => {
    getPlatform().then(setPlatform);
  }, []);

  const steps = getFixSteps(patternId, filePath, platform);

  return (
    <div className="mt-1 p-4 bg-blue-950/30 rounded-xl border border-blue-500/10">
      <p className="font-semibold text-sm text-blue-300 mb-4 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
        How to fix this
      </p>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <StepItem key={i} step={step} index={i + 1} />
        ))}
      </ol>
    </div>
  );
}

function StepItem({ step, index }: { step: FixStep; index: number }) {
  const iconStyles = {
    warning: "bg-red-500/15 text-red-400 border-red-500/20",
    secure: "bg-green-500/15 text-green-400 border-green-500/20",
    info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    default: "bg-blue-500/10 text-blue-400",
  };
  const iconStyle = iconStyles[step.type ?? "default"];

  return (
    <li className="flex gap-3 text-sm">
      <span
        className={`flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold mt-0.5 ${iconStyle}`}
      >
        {step.type === "warning" ? "!" : step.type === "secure" ? "\u2713" : index}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-slate-300 leading-relaxed">{step.text}</span>
        {step.code && (
          <pre className="mt-2 p-3 bg-slate-900/80 border border-slate-700/40 rounded-lg text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {step.code}
          </pre>
        )}
      </div>
    </li>
  );
}
