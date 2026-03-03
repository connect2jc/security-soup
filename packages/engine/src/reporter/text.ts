import type { ScanResult } from "../types.js";
import { getLabelColor } from "../scorer/scorer.js";

// ANSI color codes (fallback when chalk is not available)
const colors = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m",
  orange: "\x1b[38;5;208m",
  bgOrange: "\x1b[48;5;208m",
};

function severityBadge(severity: string): string {
  switch (severity) {
    case "critical":
      return `${colors.bgRed}${colors.white}${colors.bold} CRITICAL ${colors.reset}`;
    case "high":
      return `${colors.bgOrange}${colors.white}${colors.bold} HIGH ${colors.reset}`;
    case "medium":
      return `${colors.bgYellow}${colors.white}${colors.bold} MEDIUM ${colors.reset}`;
    case "low":
      return `${colors.bgBlue}${colors.white}${colors.bold} LOW ${colors.reset}`;
    default:
      return severity.toUpperCase();
  }
}

function scoreColor(score: number): string {
  const color = getLabelColor(score);
  switch (color) {
    case "green": return colors.green;
    case "blue": return colors.blue;
    case "yellow": return colors.yellow;
    case "orange": return colors.orange;
    case "red": return colors.red;
    default: return colors.white;
  }
}

export function formatText(result: ScanResult, noColor = false): string {
  const c = noColor
    ? Object.fromEntries(Object.keys(colors).map((k) => [k, ""]))
    : colors;

  const lines: string[] = [];

  lines.push("");
  lines.push(
    `${c.bold}  SecureSecrets Security Report${(c as typeof colors).reset}`
  );
  lines.push(
    `${(c as typeof colors).dim}  ${result.timestamp}${(c as typeof colors).reset}`
  );
  lines.push("");

  // Score
  const sc = noColor ? "" : scoreColor(result.score);
  lines.push(
    `  Score: ${sc}${c.bold}${result.score}/100 (${result.scoreLabel})${(c as typeof colors).reset}`
  );
  lines.push("");

  // Summary
  const critical = result.findings.filter(
    (f) => f.severity === "critical"
  ).length;
  const high = result.findings.filter((f) => f.severity === "high").length;
  const medium = result.findings.filter(
    (f) => f.severity === "medium"
  ).length;
  const low = result.findings.filter((f) => f.severity === "low").length;

  lines.push(`  ${c.bold}Findings Summary${(c as typeof colors).reset}`);
  lines.push(
    `  ${(c as typeof colors).red}Critical: ${critical}${(c as typeof colors).reset}  ${(c as typeof colors).orange}High: ${high}${(c as typeof colors).reset}  ${(c as typeof colors).yellow}Medium: ${medium}${(c as typeof colors).reset}  ${(c as typeof colors).blue}Low: ${low}${(c as typeof colors).reset}  Total: ${result.findings.length}`
  );
  lines.push("");

  // Findings
  if (result.findings.length > 0) {
    lines.push(`  ${c.bold}Findings${(c as typeof colors).reset}`);
    lines.push(`  ${"─".repeat(60)}`);

    for (const finding of result.findings) {
      const badge = noColor
        ? `[${finding.severity.toUpperCase()}]`
        : severityBadge(finding.severity);
      lines.push(`  ${badge} ${finding.description}`);
      lines.push(
        `  ${(c as typeof colors).dim}File: ${finding.file}:${finding.line}${(c as typeof colors).reset}`
      );
      lines.push(
        `  ${(c as typeof colors).dim}Found: ${finding.context}${(c as typeof colors).reset}`
      );
      lines.push(
        `  ${(c as typeof colors).cyan}Fix: ${finding.recommendation}${(c as typeof colors).reset}`
      );
      lines.push("");
    }
  }

  // Audit
  if (result.audit.length > 0) {
    lines.push(`  ${c.bold}Audit Checks${(c as typeof colors).reset}`);
    lines.push(`  ${"─".repeat(60)}`);

    for (const check of result.audit) {
      const icon = check.passed
        ? `${(c as typeof colors).green}PASS${(c as typeof colors).reset}`
        : `${(c as typeof colors).red}FAIL${(c as typeof colors).reset}`;
      lines.push(`  [${icon}] ${check.name}`);
      if (!check.passed) {
        lines.push(
          `       ${(c as typeof colors).cyan}${check.recommendation}${(c as typeof colors).reset}`
        );
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
