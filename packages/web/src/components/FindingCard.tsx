import { useState, useRef, useEffect } from "react";
import type { Finding } from "../types";
import SeverityBadge from "./SeverityBadge";
import FixGuide from "./FixGuide";
import { getExplanation } from "../lib/explanations";
import { ChevronDown } from "./Icons";

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
        open ? "ring-1 ring-slate-600/30" : ""
      }`}
      style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center gap-3 text-left group"
      >
        <SeverityBadge severity={finding.severity} />
        <span className="flex-1 font-medium text-sm leading-snug transition-colors" style={{ color: "var(--text-secondary)" }}>
          {explanation}
        </span>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${open ? "rotate-180" : ""}`}
          style={{ background: "var(--badge-bg)", color: "var(--text-muted)" }}
        >
          <ChevronDown size={12} strokeWidth={2.5} />
        </div>
      </button>

      <div
        className="overflow-hidden"
        style={{
          maxHeight: open ? contentHeight + 20 : 0,
          opacity: open ? 1 : 0,
          transition: "max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
        }}
      >
        <div ref={contentRef} className="px-4 pb-4 pt-2 space-y-4" style={{ borderTop: "1px solid var(--border-secondary)" }}>
          <div className="grid grid-cols-2 gap-3">
            <MetaChip label="Provider" value={finding.provider} />
            <MetaChip label="Pattern" value={finding.patternId} />
          </div>

          <MetaChip label="Location" value={`${finding.file}:${finding.line}`} fullWidth />

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Detected</span>
            <div className="mt-1.5">
              <code
                className="px-3 py-2 rounded-lg text-xs font-mono text-amber-400/80 inline-block"
                style={{ background: "var(--code-bg)", border: "1px solid var(--code-border)" }}
              >
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
    <div
      className={`rounded-lg px-3 py-2 ${fullWidth ? "col-span-2" : ""}`}
      style={{ background: "var(--badge-bg)" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</span>
      <p className="text-sm mt-0.5 break-all font-medium" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}
