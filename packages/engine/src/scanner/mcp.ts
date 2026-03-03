import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import type { Finding } from "../types.js";
import { detectSecrets } from "../detector/detector.js";
import { walkFiles } from "./filesystem.js";

/**
 * Known MCP client config file locations (cross-platform).
 */
function getMcpConfigPaths(): string[] {
  const home = homedir();
  const platform = process.platform;
  const paths: string[] = [];

  // Claude Desktop
  if (platform === "darwin") {
    paths.push(path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json"));
  } else if (platform === "win32") {
    paths.push(path.join(process.env.APPDATA ?? path.join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json"));
  } else {
    paths.push(path.join(home, ".config", "claude", "claude_desktop_config.json"));
  }

  // Cursor
  paths.push(path.join(home, ".cursor", "mcp.json"));
  // VS Code
  paths.push(path.join(home, ".vscode", "mcp.json"));
  // Windsurf
  paths.push(path.join(home, ".codeium", "windsurf", "mcp_config.json"));

  return paths;
}

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

async function scanMcpJson(filePath: string): Promise<Finding[]> {
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(content);
    const strings = extractJsonStrings(parsed);
    return detectSecrets(strings, filePath);
  } catch {
    return [];
  }
}

/**
 * Scan MCP client configuration files for secrets.
 */
export async function scanMcpConfigs(
  workingDir?: string
): Promise<Finding[]> {
  const findings: Finding[] = [];

  // Scan known MCP config paths
  for (const configPath of getMcpConfigPaths()) {
    if (await fileExists(configPath)) {
      findings.push(...(await scanMcpJson(configPath)));
    }
  }

  // Glob for mcp*.json in working directory (depth-limited)
  if (workingDir) {
    const files = await walkFiles(workingDir, {
      filter: (f) => {
        const basename = path.basename(f).toLowerCase();
        return basename.startsWith("mcp") && basename.endsWith(".json");
      },
      maxDepth: 5,
    });

    for (const file of files) {
      findings.push(...(await scanMcpJson(file)));
    }
  }

  return findings;
}
