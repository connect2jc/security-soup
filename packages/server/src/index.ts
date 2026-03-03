import express from "express";
import cors from "cors";
import { exec } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { apiRouter } from "./routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = parseInt(process.env["PORT"] ?? "19384", 10);

app.use(cors({ origin: true }));
app.use(express.json());

// API routes
app.use("/api", apiRouter);

// Serve static web UI if built
const webDistPath = resolve(__dirname, "..", "..", "web", "dist");
if (existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(resolve(webDistPath, "index.html"));
  });
}

app.listen(port, "127.0.0.1", () => {
  console.log(`SecureSecrets server running at http://localhost:${port}`);

  // Auto-open browser if requested
  if (process.env["OPEN_BROWSER"] === "1") {
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

export default app;
