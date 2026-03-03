import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import type { Finding } from "../types.js";
import { detectSecrets } from "../detector/detector.js";

const HISTORY_FILES = [
  ".zsh_history",
  ".bash_history",
  ".zshrc",
  ".bashrc",
  ".zprofile",
  ".bash_profile",
];

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Scan shell history and rc files for secrets.
 */
export async function scanShellHistory(): Promise<Finding[]> {
  const home = homedir();
  const findings: Finding[] = [];

  for (const filename of HISTORY_FILES) {
    const filePath = path.join(home, filename);
    if (!(await fileExists(filePath))) continue;

    try {
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n");
      const fileFindings = detectSecrets(lines, filePath);
      findings.push(...fileFindings);
    } catch {
      // Skip unreadable files
    }
  }

  return findings;
}
