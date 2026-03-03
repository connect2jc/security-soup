import type { Finding, ScanOptions } from "../types.js";
import { scanEnvFiles } from "./env.js";
import { scanOpenClaw } from "./openclaw.js";
import { scanMcpConfigs } from "./mcp.js";
import { scanShellHistory } from "./history.js";
import { scanGitHistory } from "./git.js";
import { scanFilesystem } from "./filesystem.js";
import { resetFindingCounter } from "../detector/detector.js";

/**
 * Deduplicate findings by file + line + patternId.
 */
function deduplicateFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const result: Finding[] = [];

  for (const f of findings) {
    const key = `${f.file}:${f.line}:${f.patternId}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(f);
    }
  }

  return result;
}

/**
 * Sort findings by severity (critical first), then by file.
 */
function sortFindings(findings: Finding[]): Finding[] {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return findings.sort((a, b) => {
    const sevDiff = order[a.severity] - order[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.file.localeCompare(b.file);
  });
}

/**
 * Run all scanners and aggregate findings.
 */
export async function runAllScanners(options: ScanOptions): Promise<Finding[]> {
  resetFindingCounter();

  const scanPath = options.path ?? process.cwd();
  const allFindings: Finding[] = [];

  if (options.openclawOnly) {
    // Only scan OpenClaw-related files
    const results = await Promise.all([
      scanOpenClaw(),
      scanMcpConfigs(scanPath),
    ]);
    allFindings.push(...results.flat());
  } else {
    // Run all scanners concurrently
    const results = await Promise.all([
      scanEnvFiles(scanPath),
      scanOpenClaw(),
      scanMcpConfigs(scanPath),
      scanShellHistory(),
      scanFilesystem(scanPath),
      ...(options.deep ? [scanGitHistory(scanPath)] : []),
    ]);
    allFindings.push(...results.flat());
  }

  return sortFindings(deduplicateFindings(allFindings));
}
