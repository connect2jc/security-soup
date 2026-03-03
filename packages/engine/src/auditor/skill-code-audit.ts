import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import type { AuditCheck } from "../types.js";

// ── Dangerous code patterns ──────────────────────────────────────────

interface CodeIssue {
  type: "env-harvesting" | "potential-exfiltration";
  severity: "critical" | "high";
  file: string;
  line: number;
  description: string;
}

// Patterns that read env vars
const envAccessPatterns = [
  /process\.env/,
  /Deno\.env/,
  /import\.meta\.env/,
  /os\.environ/,
];

// Patterns that read files
const fileReadPatterns = [
  /fs\.readFile/,
  /fs\.readFileSync/,
  /readFile\(/,
  /createReadStream/,
  /Deno\.readFile/,
  /Deno\.readTextFile/,
];

// Patterns that send data over the network
const networkSendPatterns = [
  /fetch\s*\(/,
  /https?\.request/,
  /https?\.get/,
  /axios\./,
  /\.post\s*\(/,
  /\.put\s*\(/,
  /XMLHttpRequest/,
  /WebSocket/,
  /net\.connect/,
  /net\.createConnection/,
  /dgram\.createSocket/,
  /nodemailer/,
  /sendMail/,
  /\.send\s*\(/,
];

const CODE_EXTENSIONS = new Set([
  ".js", ".mjs", ".cjs", ".ts", ".mts", ".cts",
  ".jsx", ".tsx", ".py", ".rb", ".sh", ".bash",
]);

const MAX_FILE_SIZE = 512 * 1024; // 512KB

/**
 * Scan actual skill source code for dangerous behavioral patterns.
 * This goes beyond manifest permissions — it reads the code itself.
 */
export async function auditSkillCode(
  skillName?: string,
): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];
  const home = homedir();

  // Check multiple possible skill directories
  const skillRoots = [
    path.join(home, ".openclaw", "skills"),
    path.join(home, ".openclaw", "workspace", "skills"),
  ];

  for (const skillsDir of skillRoots) {
    let entries: { name: string; isDirectory: () => boolean }[];
    try {
      entries = await readdir(skillsDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      if (skillName && name !== skillName) continue;

      const skillDir = path.join(skillsDir, name);
      const issues = await scanSkillDirectory(skillDir);

      if (issues.length > 0) {
        const criticalIssues = issues.filter((i) => i.severity === "critical");
        const warnIssues = issues.filter((i) => i.severity === "high");

        // Count scanned files
        const scannedFiles = new Set(issues.map((i) => i.file)).size;
        const allFiles = await countCodeFiles(skillDir);

        if (criticalIssues.length > 0) {
          const details = criticalIssues.map(
            (i) => `  - [${i.type}] ${i.description} (${path.relative(skillDir, i.file)}:${i.line})`,
          );
          checks.push({
            id: `skills.code_safety.${name}.critical`,
            name: `Skill "${readableSkillName(name)}" contains dangerous code patterns`,
            passed: false,
            severity: "critical",
            description:
              `Found ${criticalIssues.length} critical issue(s) in ${allFiles} scanned file(s) under ${skillDir}:\n${details.join("\n")}`,
            recommendation:
              `Review the skill source code before use. If untrusted, remove "${skillDir}".`,
          });
        }

        if (warnIssues.length > 0) {
          const details = warnIssues.map(
            (i) => `  - [${i.type}] ${i.description} (${path.relative(skillDir, i.file)}:${i.line})`,
          );
          checks.push({
            id: `skills.code_safety.${name}.warn`,
            name: `Skill "${readableSkillName(name)}" contains suspicious code patterns`,
            passed: false,
            severity: "high",
            description:
              `Found ${warnIssues.length} warning(s) in ${allFiles} scanned file(s) under ${skillDir}:\n${details.join("\n")}`,
            recommendation:
              `Review flagged lines to ensure the behavior is intentional and safe.`,
          });
        }
      }
    }
  }

  return checks;
}

/**
 * Scan all code files in a skill directory for dangerous patterns.
 */
async function scanSkillDirectory(dir: string): Promise<CodeIssue[]> {
  const issues: CodeIssue[] = [];
  const files = await walkCodeFiles(dir);

  for (const file of files) {
    const fileIssues = await analyzeFile(file);
    issues.push(...fileIssues);
  }

  return issues;
}

/**
 * Analyze a single file for dangerous patterns.
 * Looks for combinations like env access + network send (credential harvesting)
 * or file read + network send (data exfiltration).
 */
async function analyzeFile(filePath: string): Promise<CodeIssue[]> {
  const issues: CodeIssue[] = [];

  let content: string;
  try {
    const stats = await stat(filePath);
    if (stats.size > MAX_FILE_SIZE) return issues;
    content = await readFile(filePath, "utf-8");
  } catch {
    return issues;
  }

  const lines = content.split("\n");

  // Track which lines have which capabilities
  const envLines: number[] = [];
  const fileReadLines: number[] = [];
  const networkLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    // Skip comments
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) continue;

    if (envAccessPatterns.some((p) => p.test(line))) envLines.push(i + 1);
    if (fileReadPatterns.some((p) => p.test(line))) fileReadLines.push(i + 1);
    if (networkSendPatterns.some((p) => p.test(line))) networkLines.push(i + 1);
  }

  // env access + network send = credential harvesting (critical)
  if (envLines.length > 0 && networkLines.length > 0) {
    // Report the env access line as the issue location
    issues.push({
      type: "env-harvesting",
      severity: "critical",
      file: filePath,
      line: envLines[0]!,
      description:
        "Environment variable access combined with network send — possible credential harvesting",
    });
  }

  // file read + network send = data exfiltration (warning)
  if (fileReadLines.length > 0 && networkLines.length > 0) {
    // Each file read + network combo is a separate warning
    for (const readLine of fileReadLines) {
      issues.push({
        type: "potential-exfiltration",
        severity: "high",
        file: filePath,
        line: readLine,
        description:
          "File read combined with network send — possible data exfiltration",
      });
    }
  }

  return issues;
}

/**
 * Recursively walk a directory for code files.
 */
async function walkCodeFiles(
  dir: string,
  depth = 0,
): Promise<string[]> {
  if (depth > 5) return [];
  const files: string[] = [];

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      files.push(...(await walkCodeFiles(fullPath, depth + 1)));
    } else if (CODE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

async function countCodeFiles(dir: string): Promise<number> {
  return (await walkCodeFiles(dir)).length;
}

/** Convert directory name to readable skill name */
function readableSkillName(dirName: string): string {
  // "imap-smtp-email" → "imap-smtp-email", "x-twitter" → "twitter-openclaw"
  return dirName;
}
