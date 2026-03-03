import { Router } from "express";
import { scan, audit, score } from "@securesecrets/engine";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.post("/scan", async (req, res) => {
  try {
    const { path, deep } = req.body ?? {};
    const result = await scan({ path, deep });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Scan failed", message: String(err) });
  }
});

apiRouter.get("/score", async (_req, res) => {
  try {
    const result = await score();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Score failed", message: String(err) });
  }
});

apiRouter.post("/audit", async (_req, res) => {
  try {
    const result = await audit();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Audit failed", message: String(err) });
  }
});
