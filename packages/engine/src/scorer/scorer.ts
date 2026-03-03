import type { Finding, AuditCheck } from "../types.js";

interface ScoreBreakdown {
  score: number;
  label: string;
}

/**
 * Calculate security score from findings and audit checks.
 * Starts at 100, deducts per unique secret issue found.
 *
 * Scoring approach:
 *  - Group findings by (patternId + redacted context) so the same key
 *    duplicated across 10 OpenClaw agent configs counts as ONE issue,
 *    not 10 separate deductions.
 *  - First unique issue per severity gets the full deduction.
 *  - Subsequent unique issues of the same severity get diminishing deductions.
 *  - Capped total deduction per severity so it never obliterates the score.
 */
export function calculateScore(
  findings: Finding[],
  auditChecks: AuditCheck[]
): ScoreBreakdown {
  let score = 100;

  // Deduplicate: same secret (same pattern + same redacted value) = one issue
  const uniqueIssues = new Map<string, Finding>();
  for (const finding of findings) {
    const key = `${finding.patternId}::${finding.context}`;
    if (!uniqueIssues.has(key)) {
      uniqueIssues.set(key, finding);
    }
  }

  // Base deductions per severity (first / subsequent unique issues)
  const deductions: Record<string, [number, number, number]> = {
    //                        first  subsequent  maxTotal
    critical: [20, 5, 45],
    high:     [12, 3, 30],
    medium:   [ 6, 2, 16],
    low:      [ 2, 1,  6],
  };

  // Track per-severity totals
  const severityCounts = new Map<string, number>();
  const severityDeducted = new Map<string, number>();

  for (const finding of uniqueIssues.values()) {
    const sev = finding.severity;
    const count = severityCounts.get(sev) ?? 0;
    severityCounts.set(sev, count + 1);

    const [first, subsequent, maxTotal] = deductions[sev] ?? [5, 2, 20];
    const alreadyDeducted = severityDeducted.get(sev) ?? 0;

    if (alreadyDeducted >= maxTotal) continue; // cap reached

    const deduction = count === 0 ? first : subsequent;
    const capped = Math.min(deduction, maxTotal - alreadyDeducted);
    score -= capped;
    severityDeducted.set(sev, alreadyDeducted + capped);
  }

  // Audit check penalties: -3 per failed check, max -15
  const failedAudits = auditChecks.filter((c) => !c.passed).length;
  score -= Math.min(failedAudits * 3, 15);

  // Bonuses
  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasHigh = findings.some((f) => f.severity === "high");
  const allAuditPassed = auditChecks.every((c) => c.passed);

  if (!hasCritical) score += 5;
  if (!hasHigh) score += 3;
  if (allAuditPassed) score += 5;

  // Floor at 0, ceiling at 100
  score = Math.max(0, Math.min(100, score));

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
