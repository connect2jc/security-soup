import { Command } from "commander";
import { score } from "@securesecrets/engine";

export const scoreCommand = new Command("score")
  .description("Calculate and display security score")
  .argument("[path]", "Directory to scan", process.cwd())
  .action(async (scanPath: string) => {
    const result = await score({ path: scanPath });

    console.log(`\n  Security Score: ${result.score}/100 (${result.label})`);
    console.log(
      `  Critical: ${result.summary.critical} | High: ${result.summary.high} | Medium: ${result.summary.medium} | Low: ${result.summary.low}`
    );
    console.log("");
  });
