import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import type { AuditCheck } from "../types.js";

interface SkillManifest {
  name?: string;
  permissions?: {
    filesystem?: string[];
    network?: string[] | boolean;
    shell?: boolean;
    env?: string[] | boolean;
  };
  [key: string]: unknown;
}

async function readSkillManifest(
  dir: string
): Promise<SkillManifest | null> {
  for (const name of ["manifest.json", "package.json", "skill.json"]) {
    try {
      const content = await readFile(path.join(dir, name), "utf-8");
      return JSON.parse(content) as SkillManifest;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Audit installed skills for risky permissions.
 */
export async function auditSkills(
  skillName?: string
): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];
  const skillsDir = path.join(homedir(), ".openclaw", "skills");

  let skillDirs: string[];
  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });
    skillDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => path.join(skillsDir, e.name));
  } catch {
    return checks; // No skills directory
  }

  for (const dir of skillDirs) {
    const name = path.basename(dir);
    if (skillName && name !== skillName) continue;

    const manifest = await readSkillManifest(dir);
    if (!manifest) continue;

    const perms = manifest.permissions;

    // Check filesystem access to sensitive dirs
    if (perms?.filesystem) {
      const accessesSensitive = perms.filesystem.some(
        (p) =>
          p.includes(".openclaw") ||
          p.includes(".ssh") ||
          p.includes("credentials") ||
          p === "/" ||
          p === "~"
      );
      checks.push({
        id: `skill-fs-${name}`,
        name: `Skill "${name}" Filesystem Access`,
        passed: !accessesSensitive,
        severity: "high",
        description: `Skill "${name}" has access to sensitive filesystem paths`,
        recommendation: `Review and restrict filesystem permissions for skill "${name}".`,
      });
    }

    // Check unrestricted network
    if (perms?.network === true || (Array.isArray(perms?.network) && perms.network.length === 0)) {
      checks.push({
        id: `skill-net-${name}`,
        name: `Skill "${name}" Network Access`,
        passed: false,
        severity: "medium",
        description: `Skill "${name}" has unrestricted network access`,
        recommendation: `Restrict network access to specific hosts for skill "${name}".`,
      });
    }

    // Check shell exec
    if (perms?.shell === true) {
      checks.push({
        id: `skill-shell-${name}`,
        name: `Skill "${name}" Shell Execution`,
        passed: false,
        severity: "high",
        description: `Skill "${name}" can execute arbitrary shell commands`,
        recommendation: `Review if skill "${name}" truly needs shell access. Consider sandboxing.`,
      });
    }

    // Check env access
    if (perms?.env === true) {
      checks.push({
        id: `skill-env-${name}`,
        name: `Skill "${name}" Environment Access`,
        passed: false,
        severity: "medium",
        description: `Skill "${name}" can access all environment variables`,
        recommendation: `Restrict env access to specific variables for skill "${name}".`,
      });
    }
  }

  return checks;
}
