import type { ScanResult } from "../types.js";
import { formatText } from "./text.js";
import { formatJson } from "./json.js";
import { formatHtml } from "./html.js";

export type ReportFormat = "text" | "json" | "html";

export function formatReport(
  result: ScanResult,
  format: ReportFormat,
  options?: { noColor?: boolean }
): string {
  switch (format) {
    case "text":
      return formatText(result, options?.noColor);
    case "json":
      return formatJson(result);
    case "html":
      return formatHtml(result);
    default:
      return formatText(result, options?.noColor);
  }
}
