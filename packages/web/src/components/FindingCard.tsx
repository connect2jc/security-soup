import { useState } from "react";
import type { Finding } from "../types";
import SeverityBadge from "./SeverityBadge";
import FixGuide from "./FixGuide";
import { getExplanation } from "../lib/explanations";

export default function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);
  const explanation = getExplanation(finding.patternId);

  return (
    <div className={`bg-slate-800/50 border rounded-xl overflow-hidden backdrop-blur-sm transition-all ${
      open ? "border-slate-600/50" : "border-slate-700/30"
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center gap-3 hover:bg-slate-700/20 text-left transition-colors"
      >
        <SeverityBadge severity={finding.severity} />
        <span className="flex-1 font-medium text-sm leading-snug">{explanation}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-slate-500 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-700/30 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Detail label="Provider" value={finding.provider} />
            <Detail label="Pattern" value={finding.patternId} />
          </div>
          <Detail
            label="Location"
            value={`${finding.file}:${finding.line}`}
          />
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Detected
            </span>
            <div className="mt-1">
              <code className="bg-slate-900/80 border border-slate-700/30 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 inline-block">
                {finding.context}
              </code>
            </div>
          </div>
          <FixGuide patternId={finding.patternId} />
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </span>
      <p className="text-sm text-slate-300 mt-0.5 break-all">{value}</p>
    </div>
  );
}
