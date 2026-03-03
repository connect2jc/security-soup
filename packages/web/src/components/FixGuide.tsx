import { useEffect, useState } from "react";
import { getFixSteps, type FixStep } from "../lib/fixes";
import { getPlatform, type Platform } from "../api";
import { Wrench } from "./Icons";

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
    <div className="mt-1 p-4 rounded-xl" style={{ background: "rgba(59, 130, 246, 0.06)", border: "1px solid rgba(59, 130, 246, 0.1)" }}>
      <p className="font-semibold text-sm text-blue-400 mb-4 flex items-center gap-2">
        <Wrench size={16} className="text-blue-400" />
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
    warning: "bg-red-500/15 text-red-400",
    secure: "bg-green-500/15 text-green-400",
    info: "bg-blue-500/15 text-blue-400",
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
        <span style={{ color: "var(--text-primary)" }} className="leading-relaxed">{step.text}</span>
        {step.code && (
          <pre
            className="mt-2 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed"
            style={{ background: "var(--code-bg)", border: "1px solid var(--code-border)", color: "var(--text-primary)" }}
          >
            {step.code}
          </pre>
        )}
      </div>
    </li>
  );
}
