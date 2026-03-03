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

interface AgentConfig {
  sandbox?: { mode?: string } | boolean;
  tools?: Record<string, unknown>;
  runtime?: string[];
  fs?: {
    workspaceOnly?: boolean;
    permissions?: string[];
  } | string[];
  [key: string]: unknown;
}

interface ChannelConfig {
  groupPolicy?: string;
  groups?: unknown[];
  [key: string]: unknown;
}

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

  // 10. Exec-approvals wildcard check
  const execApprovalsPath = path.join(home, ".openclaw", "exec-approvals.json");
  const execApprovals = (await readJson(execApprovalsPath)) as Record<string, unknown> | null;
  let hasWildcardExec = false;
  if (execApprovals) {
    const checkForWildcard = (obj: unknown): boolean => {
      if (typeof obj === "string" && obj === "*") return true;
      if (Array.isArray(obj)) return obj.some(checkForWildcard);
      if (obj !== null && typeof obj === "object") {
        for (const val of Object.values(obj as Record<string, unknown>)) {
          if (typeof val === "object" && val !== null) {
            const entry = val as Record<string, unknown>;
            // Check for wildcard pattern in allowlists
            if (entry["pattern"] === "*") return true;
            if (Array.isArray(entry["allowlist"])) {
              for (const item of entry["allowlist"] as Record<string, unknown>[]) {
                if (item["pattern"] === "*") return true;
              }
            }
          }
          if (checkForWildcard(val)) return true;
        }
      }
      return false;
    };
    hasWildcardExec = checkForWildcard(execApprovals);
  }
  checks.push({
    id: "exec-approvals-wildcard",
    name: "Execution Approval Restrictions",
    passed: !hasWildcardExec,
    severity: "critical",
    description:
      "exec-approvals.json contains a wildcard pattern (\"*\") that allows agents to execute any command without restriction. This effectively disables execution sandboxing.",
    recommendation:
      "Remove wildcard patterns from exec-approvals.json. Restrict each agent to specific commands they need (e.g., git, npm, node) instead of allowing everything.",
  });

  // 11. Device auto-pairing check
  const devicesPath = path.join(home, ".openclaw", "devices", "paired.json");
  const devices = (await readJson(devicesPath)) as Record<string, unknown>[] | Record<string, unknown> | null;
  let hasAutoApproval = false;
  if (config) {
    const pairing = (config as Record<string, unknown>)["pairing"] as Record<string, unknown> | undefined;
    hasAutoApproval = pairing?.["autoApprove"] === true ||
      pairing?.["mode"] === "auto" ||
      (config as Record<string, unknown>)["deviceAutoApprove"] === true;
  }
  // Also check gateway logs for auto-approval events
  const gatewayLogPath = path.join(home, ".openclaw", "logs", "gateway.log");
  if (!hasAutoApproval) {
    try {
      const log = await readFile(gatewayLogPath, "utf-8");
      if (log.includes("auto-approved")) hasAutoApproval = true;
    } catch { /* no log file */ }
  }
  checks.push({
    id: "device-auto-pairing",
    name: "Device Pairing Security",
    passed: !hasAutoApproval,
    severity: "critical",
    description:
      "Devices are being auto-approved with operator-level access. Any device that connects gets full admin privileges without manual review.",
    recommendation:
      "Disable auto-approval for device pairing. Require manual confirmation for each new device connection.",
  });

  // 12. Trusted proxies
  const gateway = config
    ? (config as Record<string, unknown>)["gateway"] as Record<string, unknown> | undefined
    : undefined;
  const bind = gateway?.["bind"] as string | undefined ??
    (config as Record<string, unknown>)?.["host"] as string | undefined;
  const trustedProxies = gateway?.["trustedProxies"] as string[] | undefined;
  const isLoopback = !bind || bind === "127.0.0.1" || bind === "localhost" || bind === "::1";
  // Only warn if loopback + no trusted proxies (reverse proxy scenario)
  checks.push({
    id: "trusted-proxies",
    name: "Reverse Proxy Headers Trusted",
    passed: !isLoopback || (Array.isArray(trustedProxies) && trustedProxies.length > 0),
    severity: "high",
    description:
      "If you expose the Control UI through a reverse proxy, trusted proxies must be configured so local-client checks cannot be spoofed",
    recommendation:
      "Set gateway.trustedProxies to your proxy IPs, or keep the Control UI local-only.",
  });

  // 11. Multi-user / Trust model analysis
  const agents = config
    ? (config as Record<string, unknown>)["agents"] as Record<string, unknown> | undefined
    : undefined;
  const channels = config
    ? (config as Record<string, unknown>)["channels"] as Record<string, unknown> | undefined
    : undefined;

  // Detect multi-user heuristic signals
  const multiUserSignals: string[] = [];
  if (channels) {
    for (const [channelName, channelVal] of Object.entries(channels)) {
      const ch = channelVal as ChannelConfig | undefined;
      if (ch?.groupPolicy === "allowlist" && Array.isArray(ch.groups) && ch.groups.length > 0) {
        multiUserSignals.push(
          `channels.${channelName}.groupPolicy="allowlist" with configured group targets`,
        );
      }
    }
  }

  // Check per-agent sandbox/tool exposure
  const exposedContexts: string[] = [];
  const agentDefaults = agents?.["defaults"] as AgentConfig | undefined;
  const agentList = agents?.["list"] as Record<string, AgentConfig> | undefined;

  const checkAgentExposure = (name: string, agent: AgentConfig | undefined) => {
    if (!agent) return;
    const sandboxOff =
      agent.sandbox === false ||
      (typeof agent.sandbox === "object" && agent.sandbox?.mode !== "all") ||
      agent.sandbox === undefined;
    const hasRuntime = Array.isArray(agent.runtime) && agent.runtime.length > 0;
    const runtimeTools = Array.isArray(agent.runtime) ? agent.runtime : [];
    const fsPerms = Array.isArray(agent.fs) ? agent.fs : (agent.fs as Record<string, unknown>)?.permissions ?? [];
    const fsWorkspaceOnly = typeof agent.fs === "object" && !Array.isArray(agent.fs)
      ? agent.fs.workspaceOnly
      : true;

    if (sandboxOff && (hasRuntime || (Array.isArray(fsPerms) && fsPerms.length > 0))) {
      const parts: string[] = [];
      parts.push(`sandbox=off`);
      if (runtimeTools.length > 0) parts.push(`runtime=[${runtimeTools.join(", ")}]`);
      if (Array.isArray(fsPerms) && fsPerms.length > 0) parts.push(`fs=[${(fsPerms as string[]).join(", ")}]`);
      if (fsWorkspaceOnly === false) parts.push(`fs.workspaceOnly=false`);
      exposedContexts.push(`${name} (${parts.join("; ")})`);
    }
  };

  if (agentDefaults) checkAgentExposure("agents.defaults", agentDefaults);
  if (agentList) {
    for (const [agentName, agentConf] of Object.entries(agentList)) {
      checkAgentExposure(`agents.list.${agentName}`, agentConf);
    }
  }

  const isMultiUser = multiUserSignals.length > 0 && exposedContexts.length > 0;

  if (multiUserSignals.length > 0 || exposedContexts.length > 0) {
    const descParts: string[] = [];
    descParts.push("Heuristic signals indicate this gateway may be reachable by multiple users:");
    for (const signal of multiUserSignals) {
      descParts.push(`- ${signal}`);
    }
    if (exposedContexts.length > 0) {
      descParts.push(
        "Runtime/process tools are exposed without full sandboxing in at least one context.",
      );
      descParts.push("Potential high-impact tool exposure contexts:");
      for (const ctx of exposedContexts) {
        descParts.push(`- ${ctx}`);
      }
    }
    descParts.push(
      "OpenClaw's default security model is personal-assistant (one trusted operator boundary), not hostile multi-tenant isolation on one shared gateway.",
    );

    checks.push({
      id: "trust-model",
      name: "Potential Multi-User Setup Detected",
      passed: !isMultiUser,
      severity: "high",
      description: descParts.join("\n"),
      recommendation:
        "If users may be mutually untrusted, split trust boundaries (separate gateways + credentials). If you intentionally run shared-user access, set agents.defaults.sandbox.mode=\"all\", keep tools.fs.workspaceOnly=true, deny runtime/fs/web tools unless required, and keep personal/private identities + credentials off that runtime.",
    });
  }

  // 12. Attack surface summary (info-level)
  const hooks = config
    ? (config as Record<string, unknown>)["hooks"] as Record<string, unknown> | undefined
    : undefined;
  const tools = config
    ? (config as Record<string, unknown>)["tools"] as Record<string, unknown> | undefined
    : undefined;
  const browser = config
    ? (config as Record<string, unknown>)["browser"] as Record<string, unknown> | undefined
    : undefined;

  // Count channel groups
  let openGroups = 0;
  let allowlistGroups = 0;
  if (channels) {
    for (const channelVal of Object.values(channels)) {
      const ch = channelVal as ChannelConfig | undefined;
      if (ch?.groupPolicy === "open") openGroups++;
      else if (ch?.groupPolicy === "allowlist") allowlistGroups++;
    }
  }

  const surfaceParts: string[] = [];
  surfaceParts.push(`groups: open=${openGroups}, allowlist=${allowlistGroups}`);
  surfaceParts.push(`tools.elevated: ${tools?.["elevated"] !== false ? "enabled" : "disabled"}`);
  surfaceParts.push(`hooks.webhooks: ${hooks?.["webhooks"] ? "enabled" : "disabled"}`);
  surfaceParts.push(`hooks.internal: ${hooks?.["internal"] !== false ? "enabled" : "disabled"}`);
  surfaceParts.push(`browser control: ${browser?.["enabled"] !== false ? "enabled" : "disabled"}`);
  surfaceParts.push(
    `trust model: personal assistant (one trusted operator boundary), not hostile multi-tenant on one shared gateway`,
  );

  checks.push({
    id: "attack-surface",
    name: "Attack Surface Summary",
    passed: true, // Info-level, always "passes"
    severity: "low",
    description: surfaceParts.join("\n"),
    recommendation:
      "Review the attack surface summary above. Disable unused capabilities to reduce exposure.",
  });

  return checks;
}
