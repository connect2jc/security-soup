export type Severity = "critical" | "high" | "medium" | "low";

export interface Finding {
  id: string;
  patternId: string;
  provider: string;
  severity: Severity;
  file: string;
  line: number;
  context: string;
  description: string;
  recommendation: string;
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
