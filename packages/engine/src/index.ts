import type {
  ScanOptions,
  ScanResult,
  ScoreResult,
  AuditResult,
} from "./types.js";
import { runAllScanners } from "./scanner/index.js";
import { runAudit } from "./auditor/index.js";
import { calculateScore } from "./scorer/scorer.js";
import { formatReport, type ReportFormat } from "./reporter/index.js";

export type {
  Severity,
  SecretPattern,
  Finding,
  AuditCheck,
  ScanOptions,
  ScanResult,
  ScoreResult,
  AuditResult,
} from "./types.js";

export { formatReport, type ReportFormat } from "./reporter/index.js";
export { getPatterns } from "./detector/patterns.js";
export { detectSecrets, redact } from "./detector/detector.js";
export { calculateScore, getLabel, getLabelColor } from "./scorer/scorer.js";

/**
 * Run a full security scan: detect secrets + audit config + calculate score.
 */
export async function scan(options: ScanOptions = {}): Promise<ScanResult> {
  const [findings, auditResult] = await Promise.all([
    runAllScanners(options),
    runAudit(),
  ]);

  const { score, label } = calculateScore(findings, auditResult.checks);

  return {
    findings,
    audit: auditResult.checks,
    score,
    scoreLabel: label,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run only the audit checks.
 */
export async function audit(skillName?: string): Promise<AuditResult> {
  return runAudit(skillName);
}

/**
 * Run a scan and return just the score.
 */
export async function score(options: ScanOptions = {}): Promise<ScoreResult> {
  const result = await scan(options);

  return {
    score: result.score,
    label: result.scoreLabel,
    summary: {
      critical: result.findings.filter((f) => f.severity === "critical").length,
      high: result.findings.filter((f) => f.severity === "high").length,
      medium: result.findings.filter((f) => f.severity === "medium").length,
      low: result.findings.filter((f) => f.severity === "low").length,
      total: result.findings.length,
    },
  };
}
