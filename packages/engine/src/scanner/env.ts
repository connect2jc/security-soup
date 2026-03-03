import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Finding } from "../types.js";
import { detectSecrets } from "../detector/detector.js";
import { walkFiles } from "./filesystem.js";

const ENV_PATTERNS = [
  /^\.env$/,
  /^\.env\..+$/,
  /^\.env\.local$/,
  /^\.env\.production$/,
];

function isEnvFile(filename: string): boolean {
  return ENV_PATTERNS.some((p) => p.test(filename));
}

/**
 * Scan for .env files from the given root and check for secrets in values.
 */
export async function scanEnvFiles(rootPath: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const files = await walkFiles(rootPath, {
    filter: (filePath) => isEnvFile(path.basename(filePath)),
    maxDepth: 10,
  });

  for (const file of files) {
    try {
      const content = await readFile(file, "utf-8");
      const lines = content.split("\n");
      const valueLines: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          valueLines.push("");
          continue;
        }
        // Extract value after = for scanning
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          valueLines.push(trimmed.slice(eqIdx + 1));
        } else {
          valueLines.push(trimmed);
        }
      }

      // Scan full lines (to catch export patterns) and values
      const fullLineFindings = detectSecrets(lines, file);
      const valueFindings = detectSecrets(valueLines, file);

      // Deduplicate by line number + patternId
      const seen = new Set<string>();
      for (const f of [...fullLineFindings, ...valueFindings]) {
        const key = `${f.file}:${f.line}:${f.patternId}`;
        if (!seen.has(key)) {
          seen.add(key);
          findings.push(f);
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  return findings;
}
