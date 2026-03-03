import { useState, useRef, useEffect } from "react";
import type { Finding } from "../types";
import SeverityBadge from "./SeverityBadge";
import FixGuide from "./FixGuide";
import { getExplanation } from "../lib/explanations";

const severityBorder: Record<string, string> = {
  critical: "border-l-red-500/40",
  high: "border-l-orange-500/40",
  medium: "border-l-yellow-500/40",
  low: "border-l-blue-500/40",
};

export default function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const explanation = getExplanation(finding.patternId);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [open]);

  return (
    <div
      className={`glass rounded-xl overflow-hidden border-l-[3px] transition-all duration-300 anim-cardReveal ${severityBorder[finding.severity]} ${
        open ? "ring-1 ring-slate-600/30" : "hover:bg-slate-800/20"
      }`}
      style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center gap-3 text-left group"
      >
        <SeverityBadge severity={finding.severity} />
        <span className="flex-1 font-medium text-sm leading-snug text-slate-300 group-hover:text-slate-200 transition-colors">
          {explanation}
        </span>
        <div className={`w-7 h-7 rounded-lg bg-slate-700/30 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${open ? "rotate-180 bg-slate-600/40" : "group-hover:bg-slate-700/50"}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Animated expandable content */}
      <div
        className="overflow-hidden transition-all duration-400"
        style={{
          maxHeight: open ? contentHeight + 20 : 0,
          opacity: open ? 1 : 0,
          transition: "max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
        }}
      >
        <div ref={contentRef} className="px-4 pb-4 pt-2 space-y-4 border-t border-slate-700/20">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetaChip label="Provider" value={finding.provider} />
            <MetaChip label="Pattern" value={finding.patternId} />
          </div>

          <MetaChip label="Location" value={`${finding.file}:${finding.line}`} fullWidth />

          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Detected</span>
            <div className="mt-1.5">
              <code className="bg-slate-900/80 border border-slate-700/30 px-3 py-2 rounded-lg text-xs font-mono text-amber-400/80 inline-block">
                {finding.context}
              </code>
            </div>
          </div>

          <FixGuide patternId={finding.patternId} filePath={finding.file} />
        </div>
      </div>
    </div>
  );
}

function MetaChip({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={`bg-slate-800/40 rounded-lg px-3 py-2 ${fullWidth ? "col-span-2" : ""}`}>
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <p className="text-sm text-slate-300 mt-0.5 break-all font-medium">{value}</p>
    </div>
  );
}
