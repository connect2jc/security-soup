import type { ScanResult } from "../types.js";

export function formatJson(result: ScanResult): string {
  const summary = {
    critical: result.findings.filter((f) => f.severity === "critical").length,
    high: result.findings.filter((f) => f.severity === "high").length,
    medium: result.findings.filter((f) => f.severity === "medium").length,
    low: result.findings.filter((f) => f.severity === "low").length,
    total: result.findings.length,
  };

  return JSON.stringify(
    {
      version: "1.0.0",
      timestamp: result.timestamp,
      score: result.score,
      scoreLabel: result.scoreLabel,
      summary,
      findings: result.findings,
      audit: result.audit,
    },
    null,
    2
  );
}
