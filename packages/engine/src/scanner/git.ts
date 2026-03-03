import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Finding } from "../types.js";
import { detectSecrets } from "../detector/detector.js";

const execFileAsync = promisify(execFile);

/**
 * Scan git history for secrets (opt-in, expensive).
 * Looks at added lines in the last 100 commits.
 */
export async function scanGitHistory(repoPath: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["log", "--all", "-p", "--diff-filter=A", "-n", "100", "--no-color"],
      {
        cwd: repoPath,
        maxBuffer: 50 * 1024 * 1024, // 50MB
      }
    );

    let currentFile = "";
    let currentCommit = "";
    const addedLines: { line: string; file: string; commit: string }[] = [];

    for (const line of stdout.split("\n")) {
      if (line.startsWith("commit ")) {
        currentCommit = line.slice(7, 47); // SHA
      } else if (line.startsWith("diff --git")) {
        const match = line.match(/b\/(.+)$/);
        if (match) currentFile = match[1];
      } else if (line.startsWith("+") && !line.startsWith("+++")) {
        addedLines.push({
          line: line.slice(1),
          file: currentFile,
          commit: currentCommit,
        });
      }
    }

    // Group by file for context-aware detection
    const byFile = new Map<string, { lines: string[]; commit: string }>();
    for (const entry of addedLines) {
      const key = `${entry.commit}:${entry.file}`;
      if (!byFile.has(key)) {
        byFile.set(key, { lines: [], commit: entry.commit });
      }
      byFile.get(key)!.lines.push(entry.line);
    }

    for (const [key, { lines, commit }] of byFile) {
      const file = key.split(":").slice(1).join(":");
      const detected = detectSecrets(lines, `[git:${commit.slice(0, 7)}] ${file}`);
      for (const f of detected) {
        f.commitSha = commit;
        findings.push(f);
      }
    }
  } catch {
    // Not a git repo or git not available — skip silently
  }

  return findings;
}
