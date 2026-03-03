import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import type { Finding } from "../types.js";
import { detectSecrets } from "../detector/detector.js";

function getHistoryFiles(): string[] {
  const files = [
    ".zsh_history",
    ".bash_history",
    ".zshrc",
    ".bashrc",
    ".zprofile",
    ".bash_profile",
  ];

  // Windows: PowerShell history + profile
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(homedir(), "AppData", "Roaming");
    files.push(
      path.join(appData, "Microsoft", "Windows", "PowerShell", "PSReadLine", "ConsoleHost_history.txt"),
      path.join(homedir(), "Documents", "WindowsPowerShell", "Microsoft.PowerShell_profile.ps1"),
      path.join(homedir(), "Documents", "PowerShell", "Microsoft.PowerShell_profile.ps1"),
    );
  }

  return files;
}

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

  for (const filename of getHistoryFiles()) {
    // Absolute paths (Windows PowerShell) vs relative (Unix dotfiles)
    const filePath = path.isAbsolute(filename) ? filename : path.join(home, filename);
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
