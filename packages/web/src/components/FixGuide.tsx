import { getFixSteps } from "../lib/fixes";

export default function FixGuide({
  patternId,
  filePath,
}: {
  patternId: string;
  filePath: string;
}) {
  const steps = getFixSteps(patternId, filePath);

  return (
    <div className="mt-1 p-4 bg-blue-950/30 rounded-xl border border-blue-500/10">
      <p className="font-semibold text-sm text-blue-300 mb-3 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
        How to fix this
      </p>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs flex items-center justify-center font-medium mt-0.5">
              {i + 1}
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
        ))}
      </ol>
    </div>
  );
}
