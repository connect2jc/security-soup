import { Command } from "commander";
import { audit } from "@securesecrets/engine";

export const auditCommand = new Command("audit")
  .description("Run security audit checks on OpenClaw configuration")
  .action(async () => {
    const result = await audit();

    console.log("\n  Security Audit Results\n");
    console.log(`  Passed: ${result.passed}/${result.total}`);
    console.log("");

    for (const check of result.checks) {
      const icon = check.passed ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
      console.log(`  [${icon}] ${check.name}`);
      if (!check.passed) {
        console.log(`       \x1b[36m${check.recommendation}\x1b[0m`);
      }
    }
    console.log("");
  });
