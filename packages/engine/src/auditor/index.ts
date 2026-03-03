import type { AuditCheck, AuditResult } from "../types.js";
import { auditOpenClaw } from "./openclaw-audit.js";
import { auditSkills } from "./skill-audit.js";

/**
 * Run all audit checks and return aggregated results.
 */
export async function runAudit(skillName?: string): Promise<AuditResult> {
  const [openclawChecks, skillChecks] = await Promise.all([
    auditOpenClaw(),
    auditSkills(skillName),
  ]);

  const checks: AuditCheck[] = [...openclawChecks, ...skillChecks];
  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed).length;

  return {
    checks,
    passed,
    failed,
    total: checks.length,
  };
}
