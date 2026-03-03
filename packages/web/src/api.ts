import type { ScanResult, ScoreResult } from "./types";

const BASE = "/api";

export async function runScan(path?: string, deep?: boolean): Promise<ScanResult> {
  const res = await fetch(`${BASE}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, deep }),
  });
  if (!res.ok) throw new Error("Scan failed");
  return res.json();
}

export async function getScore(): Promise<ScoreResult> {
  const res = await fetch(`${BASE}/score`);
  if (!res.ok) throw new Error("Score failed");
  return res.json();
}

export async function runAudit() {
  const res = await fetch(`${BASE}/audit`, { method: "POST" });
  if (!res.ok) throw new Error("Audit failed");
  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export type Platform = "darwin" | "win32" | "linux";

let cachedPlatform: Platform | null = null;

export async function getPlatform(): Promise<Platform> {
  if (cachedPlatform) return cachedPlatform;
  try {
    const res = await fetch(`${BASE}/platform`);
    const data = await res.json();
    cachedPlatform = data.platform as Platform;
    return cachedPlatform;
  } catch {
    return "darwin"; // fallback
  }
}
