import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import type { Finding } from "../types.js";
import { detectSecrets } from "../detector/detector.js";
import { walkFiles } from "./filesystem.js";

/**
 * Get all OpenClaw-related file paths to scan.
 */
function getOpenClawPaths(): string[] {
  const home = homedir();
  const oc = path.join(home, ".openclaw");
  return [
    path.join(oc, "openclaw.json"),
    path.join(oc, "secrets.json"),
    path.join(oc, ".env"),
    path.join(oc, "MEMORY.md"),
  ];
}

function getOpenClawDirs(): string[] {
  const home = homedir();
  const oc = path.join(home, ".openclaw");
  return [
    path.join(oc, "agents"),
    path.join(oc, "channels"),
    path.join(oc, "memory"),
  ];
}

/**
 * Recursively extract all string values from a JSON object.
 */
function extractJsonStrings(obj: unknown): string[] {
  const strings: string[] = [];
  if (typeof obj === "string") {
    strings.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      strings.push(...extractJsonStrings(item));
    }
  } else if (obj !== null && typeof obj === "object") {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      strings.push(...extractJsonStrings(value));
    }
  }
  return strings;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function scanJsonFile(filePath: string): Promise<Finding[]> {
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(content);
    const strings = extractJsonStrings(parsed);
    // Scan each string value as a single-line content
    return detectSecrets(strings, filePath);
  } catch {
    return [];
  }
}

async function scanTextFile(filePath: string): Promise<Finding[]> {
  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");
    return detectSecrets(lines, filePath);
  } catch {
    return [];
  }
}

/**
 * Scan OpenClaw configuration files and directories for secrets.
 */
export async function scanOpenClaw(): Promise<Finding[]> {
  const findings: Finding[] = [];

  // Scan known config files
  for (const filePath of getOpenClawPaths()) {
    if (!(await fileExists(filePath))) continue;

    if (filePath.endsWith(".json")) {
      findings.push(...(await scanJsonFile(filePath)));
    } else {
      findings.push(...(await scanTextFile(filePath)));
    }
  }

  // Scan directories
  for (const dir of getOpenClawDirs()) {
    if (!(await fileExists(dir))) continue;

    const files = await walkFiles(dir, { maxDepth: 3 });
    for (const file of files) {
      if (file.endsWith(".json")) {
        findings.push(...(await scanJsonFile(file)));
      } else {
        findings.push(...(await scanTextFile(file)));
      }
    }
  }

  return findings;
}
