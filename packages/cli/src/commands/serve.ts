import { Command } from "commander";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const serveCommand = new Command("serve")
  .description("Start the SecureSecrets web UI server")
  .option("-p, --port <port>", "Port to listen on", "19384")
  .option("--no-open", "Don't auto-open browser")
  .action(async (opts) => {
    // The server package is a sibling workspace package
    const serverEntry = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "server",
      "dist",
      "index.js"
    );

    console.log(`Starting SecureSecrets server on http://localhost:${opts.port}`);

    const child = spawn("node", [serverEntry], {
      env: {
        ...process.env,
        PORT: opts.port,
        OPEN_BROWSER: opts.open !== false ? "1" : "0",
      },
      stdio: "inherit",
    });

    process.on("SIGINT", () => {
      child.kill("SIGINT");
      process.exit(0);
    });
  });
