import { readFile, access } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { homedir } from "node:os";
import type { AuditCheck } from "../types.js";

const execFileAsync = promisify(execFile);

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath: string): Promise<unknown> {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

type OpenClawConfig = Record<string, unknown>;

/**
 * Run OpenClaw security configuration audit checks.
 */
export async function auditOpenClaw(): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];
  const home = homedir();
  const configPath = path.join(home, ".openclaw", "openclaw.json");

  const config = (await readJson(configPath)) as OpenClawConfig | null;

  // 1. Auth enabled
  checks.push({
    id: "auth-enabled",
    name: "Gateway Authentication",
    passed: config
      ? Boolean(
          (config as Record<string, unknown>)["authToken"] ||
            (config as Record<string, unknown>)["authPassword"] ||
            (config as Record<string, unknown>)["auth"]
        )
      : false,
    severity: "critical",
    description: "Gateway should have authentication configured",
    recommendation:
      'Set an "authToken" or "authPassword" in openclaw.json, or enable OAuth/SSO.',
  });

  // 2. Sandbox enabled
  checks.push({
    id: "sandbox-enabled",
    name: "Sandbox Mode",
    passed: config
      ? (config as Record<string, unknown>)["sandbox"] === true
      : false,
    severity: "high",
    description: "Sandbox mode should be enabled to restrict skill execution",
    recommendation: 'Set "sandbox": true in openclaw.json.',
  });

  // 3. CORS restricted
  const corsValue = config
    ? (config as Record<string, unknown>)["cors"]
    : undefined;
  checks.push({
    id: "cors-restricted",
    name: "CORS Restriction",
    passed: corsValue !== "*" && corsValue !== undefined,
    severity: "high",
    description: "CORS should not be set to wildcard (*)",
    recommendation:
      "Set CORS to specific origins instead of '*', or remove it for local-only use.",
  });

  // 4. Gateway binding
  const bindAddress = config
    ? ((config as Record<string, unknown>)["host"] as string | undefined)
    : undefined;
  const hasAuth = checks[0]!.passed;
  checks.push({
    id: "gateway-binding",
    name: "Gateway Binding Address",
    passed: bindAddress !== "0.0.0.0" || hasAuth,
    severity: "critical",
    description:
      "Gateway should not be bound to 0.0.0.0 without authentication",
    recommendation:
      'Bind to "127.0.0.1" for local-only access, or enable authentication for network access.',
  });

  // 5. Denied paths
  const deniedPaths = config
    ? ((config as Record<string, unknown>)["deniedPaths"] as
        | string[]
        | undefined)
    : undefined;
  const hasDeniedCredentials =
    Array.isArray(deniedPaths) &&
    deniedPaths.some(
      (p) => p.includes("credentials") || p.includes(".ssh")
    );
  checks.push({
    id: "denied-paths",
    name: "Sensitive Path Restrictions",
    passed: hasDeniedCredentials,
    severity: "high",
    description:
      "Sensitive paths like ~/.openclaw/credentials and ~/.ssh should be denied",
    recommendation:
      'Add "~/.openclaw/credentials" and "~/.ssh" to "deniedPaths" in config.',
  });

  // 6. SecretRef usage
  // Check if config contains plaintext secrets vs SecretRef patterns
  const configStr = config ? JSON.stringify(config) : "";
  const hasPlaintextSecrets =
    /sk-ant-|sk-proj-|sk-or-|ghp_|gho_|sk_live_/.test(configStr);
  checks.push({
    id: "secretref-used",
    name: "SecretRef Usage",
    passed: !hasPlaintextSecrets,
    severity: "high",
    description: "Secrets should use SecretRef instead of plaintext values",
    recommendation:
      "Replace plaintext secrets with SecretRef references to environment variables.",
  });

  // 7. Logging redaction
  const redactPatterns = config
    ? (config as Record<string, unknown>)["redactPatterns"]
    : undefined;
  checks.push({
    id: "logging-redaction",
    name: "Logging Redaction",
    passed: Array.isArray(redactPatterns) && redactPatterns.length > 0,
    severity: "medium",
    description: "Redaction patterns should be configured for logging",
    recommendation:
      "Add regex patterns to redactPatterns to prevent secrets in logs.",
  });

  // 8. Node version
  let nodeVersionOk = false;
  try {
    const { stdout } = await execFileAsync("node", ["--version"]);
    const version = stdout.trim().replace("v", "");
    const [major, minor] = version.split(".").map(Number);
    nodeVersionOk = major! > 22 || (major === 22 && minor! >= 12);
  } catch {
    // Can't check
  }
  checks.push({
    id: "node-version",
    name: "Node.js Version",
    passed: nodeVersionOk,
    severity: "medium",
    description: "Node.js should be >= 22.12.0 for latest security patches",
    recommendation: "Update Node.js to version 22.12.0 or later.",
  });

  // 9. Skills verified
  const skillsDir = path.join(home, ".openclaw", "skills");
  let allVerified = true;
  if (await fileExists(skillsDir)) {
    // Check if there's a skills config or manifests
    const skillsConfig = await readJson(
      path.join(home, ".openclaw", "skills.json")
    );
    if (skillsConfig && typeof skillsConfig === "object") {
      const skills = Object.values(
        skillsConfig as Record<string, Record<string, unknown>>
      );
      allVerified = skills.every((s) => s["verified"] === true);
    }
  }
  checks.push({
    id: "skills-verified",
    name: "Verified Skills Only",
    passed: allVerified,
    severity: "medium",
    description: "Only verified ClawHub skills should be installed",
    recommendation:
      "Review installed skills and remove unverified ones from ClawHub.",
  });

  return checks;
}
