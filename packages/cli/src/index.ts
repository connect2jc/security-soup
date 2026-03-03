#!/usr/bin/env node
import { Command } from "commander";
import { scanCommand } from "./commands/scan.js";
import { auditCommand } from "./commands/audit.js";
import { scoreCommand } from "./commands/score.js";
import { reportCommand } from "./commands/report.js";
import { serveCommand } from "./commands/serve.js";

const program = new Command();

program
  .name("securesecrets")
  .description("Security scanner for AI tool configurations and secrets")
  .version("1.0.0");

program.addCommand(scanCommand);
program.addCommand(auditCommand);
program.addCommand(scoreCommand);
program.addCommand(reportCommand);
program.addCommand(serveCommand);

program.parse();
