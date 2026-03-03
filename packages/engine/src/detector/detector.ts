import type { Finding, SecretPattern } from "../types.js";
import { getPatterns } from "./patterns.js";

let findingCounter = 0;

export function resetFindingCounter(): void {
  findingCounter = 0;
}

/** Redact a secret: show first 8 chars + ... + last 4 chars */
export function redact(value: string): string {
  if (value.length <= 16) return "****";
  return value.slice(0, 8) + "..." + value.slice(-4);
}

/** Recommendations per pattern ID */
const RECOMMENDATIONS: Record<string, string> = {
  "anthropic-api-key":
    "Move this key to an environment variable or secret manager. Rotate the key at console.anthropic.com.",
  "anthropic-oauth":
    "Move this token to a secure credential store. Rotate at console.anthropic.com.",
  "openai-api-key":
    "Move this key to an environment variable. Rotate at platform.openai.com/api-keys.",
  "openai-api-key-legacy":
    "Move this key to an environment variable. Rotate at platform.openai.com/api-keys.",
  "google-api-key":
    "Move this key to an environment variable. Restrict the key in Google Cloud Console.",
  "openrouter-api-key":
    "Move this key to an environment variable. Rotate at openrouter.ai/keys.",
  "aws-access-key":
    "Move to environment variables or AWS credentials file. Rotate in IAM console.",
  "aws-secret-key":
    "Move to environment variables or AWS credentials file. Rotate in IAM console.",
  "github-pat":
    "Move to an environment variable. Rotate at github.com/settings/tokens.",
  "github-pat-fine":
    "Move to an environment variable. Rotate at github.com/settings/tokens.",
  "github-oauth":
    "Move to a secure credential store. Revoke at github.com/settings/applications.",
  "github-app":
    "Move to a secure credential store. Regenerate token via GitHub App settings.",
  "gitlab-pat":
    "Move to an environment variable. Rotate at gitlab.com/-/user_settings/personal_access_tokens.",
  "telegram-bot":
    "Move to an environment variable. Rotate via @BotFather on Telegram.",
  "discord-bot":
    "Move to an environment variable. Regenerate at discord.com/developers.",
  "slack-token":
    "Move to an environment variable. Rotate at api.slack.com/apps.",
  "slack-webhook":
    "Move to an environment variable. Consider restricting webhook permissions.",
  "stripe-secret":
    "Move to an environment variable. Rotate at dashboard.stripe.com/apikeys.",
  "stripe-restricted":
    "Move to an environment variable. Rotate at dashboard.stripe.com/apikeys.",
  "private-key":
    "Move this key to a secure location with restricted file permissions (chmod 600).",
  "deepseek-api-key":
    "Move this key to an environment variable or secret manager.",
  "env-export":
    "Use a .env file with dotenv instead of hardcoding secrets in shell configs.",
  "generic-secret":
    "Move this value to an environment variable or secret manager.",
};

function getRecommendation(patternId: string): string {
  return (
    RECOMMENDATIONS[patternId] ??
    "Move this secret to a secure environment variable or secret manager."
  );
}

/**
 * Run detection patterns against content lines.
 * Returns findings for all matches.
 */
export function detectSecrets(
  lines: string[],
  filePath: string,
  patterns?: SecretPattern[]
): Finding[] {
  const pats = patterns ?? getPatterns();
  const findings: Finding[] = [];
  const matchedRanges = new Set<string>(); // "line:start:end" to deduplicate

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const pat of pats) {
      // Context-aware patterns need keyword nearby
      if (pat.contextAware) {
        const contextRange = pat.contextLines ?? 3;
        const start = Math.max(0, i - contextRange);
        const end = Math.min(lines.length - 1, i + contextRange);
        const contextBlock = lines
          .slice(start, end + 1)
          .join("\n")
          .toLowerCase();
        const hasKeyword = (pat.contextKeywords ?? []).some((kw) =>
          contextBlock.includes(kw.toLowerCase())
        );
        if (!hasKeyword) continue;
      }

      const match = line.match(pat.pattern);
      if (!match) continue;

      const matchStart = match.index ?? 0;
      const matchEnd = matchStart + match[0].length;
      const rangeKey = `${i}:${matchStart}:${matchEnd}`;

      // Skip if this range is already covered by a more specific pattern
      if (matchedRanges.has(rangeKey)) continue;

      // Check for overlapping ranges from earlier, more specific patterns
      let overlaps = false;
      for (const existing of matchedRanges) {
        const [existLine, existStart, existEnd] = existing
          .split(":")
          .map(Number);
        if (
          existLine === i &&
          matchStart < existEnd! &&
          matchEnd > existStart!
        ) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      matchedRanges.add(rangeKey);
      findingCounter++;

      findings.push({
        id: `F${findingCounter.toString().padStart(4, "0")}`,
        patternId: pat.id,
        provider: pat.provider,
        severity: pat.severity,
        file: filePath,
        line: i + 1,
        context: redact(match[0]),
        description: pat.description,
        recommendation: getRecommendation(pat.id),
      });
    }
  }

  return findings;
}
