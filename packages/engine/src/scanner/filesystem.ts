import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Finding } from "../types.js";
import { detectSecrets } from "../detector/detector.js";

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "vendor",
  "dist",
  ".next",
  ".nuxt",
  "__pycache__",
  ".venv",
  "venv",
  ".cache",
]);

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp", ".bmp",
  ".mp3", ".mp4", ".avi", ".mov", ".mkv", ".flac", ".wav",
  ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".exe", ".dll", ".so", ".dylib", ".bin",
  ".pyc", ".pyo", ".class", ".o", ".a",
  ".sqlite", ".db", ".sqlite3",
  ".lock",
]);

const MAX_FILE_SIZE = 1_000_000; // 1MB
const CONCURRENCY = 10;

export interface WalkOptions {
  filter?: (filePath: string) => boolean;
  maxDepth?: number;
  maxFileSize?: number;
}

/**
 * Recursively walk a directory and return matching file paths.
 */
export async function walkFiles(
  rootPath: string,
  options: WalkOptions = {}
): Promise<string[]> {
  const { filter, maxDepth = 20 } = options;
  const results: string[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          await walk(fullPath, depth + 1);
        }
      } else if (entry.isFile()) {
        if (BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
          continue;
        }
        if (filter && !filter(fullPath)) continue;
        results.push(fullPath);
      }
    }
  }

  await walk(rootPath, 0);
  return results;
}

/**
 * Scan all text files in a directory tree for secrets.
 * Uses a concurrency pool for file reads.
 */
export async function scanFilesystem(rootPath: string): Promise<Finding[]> {
  const files = await walkFiles(rootPath);
  const findings: Finding[] = [];
  const maxSize = MAX_FILE_SIZE;

  // Process files with concurrency limit
  let idx = 0;
  const processFile = async (): Promise<void> => {
    while (idx < files.length) {
      const fileIdx = idx++;
      const file = files[fileIdx]!;

      try {
        const stats = await stat(file);
        if (stats.size > maxSize) continue;

        const content = await readFile(file, "utf-8");
        const lines = content.split("\n");
        const fileFindings = detectSecrets(lines, file);
        findings.push(...fileFindings);
      } catch {
        // Skip unreadable files
      }
    }
  };

  const workers = Array.from({ length: CONCURRENCY }, () => processFile());
  await Promise.all(workers);

  return findings;
}
