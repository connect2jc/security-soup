import { Command } from "commander";
import { writeFile } from "node:fs/promises";
import { scan, formatReport, type ReportFormat } from "@securesecrets/engine";

export const reportCommand = new Command("report")
  .description("Generate a full security report (scan + audit + score)")
  .argument("[path]", "Directory to scan", process.cwd())
  .option("-f, --format <format>", "Output format: text, json, html", "html")
  .option("-o, --output <file>", "Write report to file")
  .option("--deep", "Include git history scanning")
  .action(async (scanPath: string, opts) => {
    const result = await scan({
      path: scanPath,
      deep: opts.deep,
    });

    const format = opts.format as ReportFormat;
    const output = formatReport(result, format);

    const outFile =
      opts.output ?? (format === "html" ? "securesecrets-report.html" : undefined);

    if (outFile) {
      await writeFile(outFile, output, "utf-8");
      console.log(`Report written to ${outFile}`);
    } else {
      console.log(output);
    }
  });
