import type { Finding, AuditCheck } from "../types.js";

interface ScoreBreakdown {
  score: number;
  label: string;
}

/**
 * Calculate security score from findings and audit checks.
 * Starts at 100, deducts per finding, adds bonuses.
 */
export function calculateScore(
  findings: Finding[],
  auditChecks: AuditCheck[]
): ScoreBreakdown {
  let score = 100;

  // Track deductions per pattern to apply diminishing returns
  const patternCounts = new Map<string, number>();

  for (const finding of findings) {
    const count = patternCounts.get(finding.patternId) ?? 0;
    patternCounts.set(finding.patternId, count + 1);
    const isFirst = count === 0;

    switch (finding.severity) {
      case "critical":
        score -= isFirst ? 25 : 12;
        break;
      case "high":
        score -= isFirst ? 15 : 7;
        break;
      case "medium":
        score -= isFirst ? 8 : 4;
        break;
      case "low":
        score -= isFirst ? 3 : 1;
        break;
    }
  }

  // Bonuses
  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasHigh = findings.some((f) => f.severity === "high");
  const allAuditPassed = auditChecks.every((c) => c.passed);

  if (!hasCritical) score += 5;
  if (!hasHigh) score += 3;
  if (allAuditPassed) score += 5;

  // Floor at 0
  score = Math.max(0, score);

  return {
    score,
    label: getLabel(score),
  };
}

export function getLabel(
  score: number
): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Attention";
  if (score >= 25) return "Poor";
  return "Critical";
}

export function getLabelColor(
  score: number
): string {
  if (score >= 90) return "green";
  if (score >= 70) return "blue";
  if (score >= 50) return "yellow";
  if (score >= 25) return "orange";
  return "red";
}
