export type Severity = "critical" | "high" | "medium" | "low";

export interface SecretPattern {
  id: string;
  name: string;
  provider: string;
  pattern: RegExp;
  severity: Severity;
  description: string;
  /** If true, needs context-aware matching (e.g. keyword nearby) */
  contextAware?: boolean;
  /** Keywords that must appear within contextLines for context-aware patterns */
  contextKeywords?: string[];
  /** Number of lines to check for context keywords (default 3) */
  contextLines?: number;
}

export interface Finding {
  id: string;
  patternId: string;
  provider: string;
  severity: Severity;
  file: string;
  line: number;
  context: string; // redacted
  description: string;
  recommendation: string;
  /** Git commit SHA if found in git history */
  commitSha?: string;
}

export interface AuditCheck {
  id: string;
  name: string;
  passed: boolean;
  severity: Severity;
  description: string;
  recommendation: string;
}

export interface ScanOptions {
  path?: string;
  deep?: boolean;
  openclawOnly?: boolean;
}

export interface ScanResult {
  findings: Finding[];
  audit: AuditCheck[];
  score: number;
  scoreLabel: string;
  timestamp: string;
}

export interface ScoreResult {
  score: number;
  label: string;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

export interface AuditResult {
  checks: AuditCheck[];
  passed: number;
  failed: number;
  total: number;
}
