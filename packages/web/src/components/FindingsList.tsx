import { useState } from "react";
import type { Finding, Severity } from "../types";
import FindingCard from "./FindingCard";

type Filter = "all" | Severity;

export default function FindingsList({ findings }: { findings: Finding[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all" ? findings : findings.filter((f) => f.severity === filter);

  const filters: Filter[] = ["all", "critical", "high", "medium", "low"];

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm border ${
              filter === f
                ? "bg-slate-700 border-slate-500"
                : "border-slate-600 hover:bg-slate-800"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 py-8">
            No findings match this filter.
          </p>
        ) : (
          filtered.map((f) => <FindingCard key={f.id} finding={f} />)
        )}
      </div>
    </div>
  );
}
