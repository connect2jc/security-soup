import { useState, useRef, useEffect } from "react";
import { AlertTriangle, AlertCircle, Check, ChevronDown } from "./Icons";

const severityStyle = {
  critical: { bg: "bg-red-500/15", text: "text-red-400", border: "border-l-red-500/40" },
  warn: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-l-orange-500/40" },
  pass: { bg: "bg-green-500/15", text: "text-green-400", border: "border-l-green-500/30" },
};

export default function AuditCard({
  check,
  index,
  variant,
}: {
  check: { id: string; name: string; passed: boolean; severity: string; description: string; recommendation: string };
  index: number;
  variant: "critical" | "warn" | "pass";
}) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const style = severityStyle[variant];

  const hasDetails = !check.passed && (check.description.includes("\n") || check.description.length > 100);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [open]);

  return (
    <div
      className={`glass rounded-xl overflow-hidden transition-all anim-cardReveal ${
        !check.passed ? `border-l-[3px] ${style.border}` : ""
      } ${open ? "ring-1 ring-slate-600/30" : ""}`}
      style={{ animationDelay: `${600 + index * 80}ms` }}
    >
      <button
        onClick={() => hasDetails && setOpen(!open)}
        className={`w-full p-4 flex items-start gap-3 text-left ${hasDetails ? "group cursor-pointer" : "cursor-default"}`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
          {check.passed ? (
            <span className={`${style.text} anim-checkPop`} style={{ animationDelay: `${700 + index * 80}ms` }}>
              <Check size={14} strokeWidth={3} />
            </span>
          ) : variant === "critical" ? (
            <span className={`${style.text} anim-failShake`} style={{ animationDelay: `${700 + index * 80}ms` }}>
              <AlertTriangle size={14} strokeWidth={2.5} />
            </span>
          ) : (
            <span className={style.text}>
              <AlertCircle size={14} strokeWidth={2.5} />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {!check.passed && (
            <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text} mb-1 block`}>
              {variant === "critical" ? "CRITICAL" : "WARNING"}
            </span>
          )}
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {check.name}
          </p>
          {!check.passed && !hasDetails && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>{check.recommendation}</p>
          )}
          {!check.passed && hasDetails && !open && (
            <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
              {check.description.split("\n")[0]}
            </p>
          )}
        </div>
        {hasDetails && (
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${open ? "rotate-180" : ""}`}
            style={{ background: "var(--badge-bg)", color: "var(--text-muted)" }}
          >
            <ChevronDown size={12} strokeWidth={2.5} />
          </div>
        )}
      </button>

      {hasDetails && (
        <div
          className="overflow-hidden"
          style={{
            maxHeight: open ? contentHeight + 20 : 0,
            opacity: open ? 1 : 0,
            transition: "max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
          }}
        >
          <div ref={contentRef} className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: "1px solid var(--border-secondary)" }}>
            <div className="rounded-lg px-3 py-2.5 space-y-1" style={{ background: "var(--bg-inset)" }}>
              {check.description.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (trimmed.startsWith("- ")) {
                  const isCodeRef = trimmed.includes(":") && (trimmed.includes(".js:") || trimmed.includes(".ts:") || trimmed.includes(".py:"));
                  return (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="flex-shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }}>{"\u2022"}</span>
                      <span className={isCodeRef ? "text-amber-400/80 font-mono" : ""} style={isCodeRef ? {} : { color: "var(--text-secondary)" }}>
                        {trimmed.slice(2)}
                      </span>
                    </div>
                  );
                }
                if (trimmed.startsWith("[") || trimmed === "") return null;
                return (
                  <p key={i} className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {trimmed}
                  </p>
                );
              })}
            </div>

            <div className="rounded-lg px-3 py-2.5" style={{ background: "var(--badge-bg)" }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Fix</span>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-primary)" }}>{check.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
