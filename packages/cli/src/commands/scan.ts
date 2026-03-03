import { Command } from "commander";
import { writeFile } from "node:fs/promises";
import { scan, formatReport, type ReportFormat } from "@securesecrets/engine";

export const scanCommand = new Command("scan")
  .description("Scan for exposed secrets and credentials")
  .argument("[path]", "Directory to scan", process.cwd())
  .option("-f, --format <format>", "Output format: text, json, html", "text")
  .option("-o, --output <file>", "Write report to file")
  .option("--deep", "Include git history scanning (slower)")
  .option("--no-color", "Disable colored output")
  .option("--openclaw-only", "Only scan OpenClaw-related files")
  .action(async (scanPath: string, opts) => {
    const result = await scan({
      path: scanPath,
      deep: opts.deep,
      openclawOnly: opts.openclawOnly,
    });

    const output = formatReport(result, opts.format as ReportFormat, {
      noColor: opts.color === false,
    });

    if (opts.output) {
      await writeFile(opts.output, output, "utf-8");
      console.log(`Report written to ${opts.output}`);
    } else {
      console.log(output);
    }
  });
