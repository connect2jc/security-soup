import { Command } from "commander";
import express from "express";
import cors from "cors";
import { exec } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { scan, audit, score } from "@securesecrets/engine";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const serveCommand = new Command("serve")
  .description("Start the SecureSecrets web UI server")
  .option("-p, --port <port>", "Port to listen on", "19384")
  .option("--no-open", "Don't auto-open browser")
  .action(async (opts) => {
    const app = express();
    const port = parseInt(opts.port, 10);

    app.use(cors({ origin: true }));
    app.use(express.json());

    // API routes
    app.get("/api/health", (_req, res) => {
      res.json({ status: "ok" });
    });

    app.post("/api/scan", async (req, res) => {
      try {
        const { path, deep } = req.body ?? {};
        const result = await scan({ path, deep });
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: "Scan failed", message: String(err) });
      }
    });

    app.get("/api/score", async (_req, res) => {
      try {
        const result = await score();
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: "Score failed", message: String(err) });
      }
    });

    app.post("/api/audit", async (_req, res) => {
      try {
        const result = await audit();
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: "Audit failed", message: String(err) });
      }
    });

    // Serve the pre-built web UI
    // Look in several locations: next to the CLI dist, or in the web-dist folder
    const webPaths = [
      resolve(__dirname, "..", "web-dist"),        // Bundled in published package
      resolve(__dirname, "..", "..", "web-dist"),   // Root of project
      resolve(__dirname, "..", "..", "web", "dist"),// Dev workspace layout
    ];
    const webDistPath = webPaths.find((p) => existsSync(p));

    if (webDistPath) {
      app.use(express.static(webDistPath));
      app.get("/{*splat}", (_req, res) => {
        res.sendFile(resolve(webDistPath, "index.html"));
      });
    } else {
      app.get("/", (_req, res) => {
        res.send(
          '<html><body style="font-family:sans-serif;text-align:center;padding:4rem">' +
            "<h1>SecureSecrets</h1>" +
            "<p>Web UI not found. Run <code>npm run build:web</code> first, or use the CLI directly:</p>" +
            "<pre>npx securesecrets scan</pre>" +
            "</body></html>"
        );
      });
    }

    app.listen(port, "127.0.0.1", () => {
      console.log("");
      console.log("  SecureSecrets server running at:");
      console.log(`  http://localhost:${port}`);
      console.log("");
      console.log("  This server is local only (127.0.0.1).");
      console.log("  No data leaves your machine.");
      console.log("  Press Ctrl+C to stop.");
      console.log("");

      if (opts.open !== false) {
        const url = `http://localhost:${port}`;
        const cmd =
          process.platform === "darwin"
            ? `open "${url}"`
            : process.platform === "win32"
              ? `start "${url}"`
              : `xdg-open "${url}"`;
        exec(cmd);
      }
    });
  });
