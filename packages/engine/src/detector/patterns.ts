import type { SecretPattern } from "../types.js";

/**
 * All detection patterns, ordered from most specific to most generic.
 * Specific patterns must come before generic ones to avoid false positives.
 */
export const PATTERNS: SecretPattern[] = [
  // Anthropic
  {
    id: "anthropic-api-key",
    name: "Anthropic API Key",
    provider: "Anthropic",
    pattern: /sk-ant-api03-[A-Za-z0-9_-]{93}/,
    severity: "critical",
    description: "Anthropic API key found in plaintext",
  },
  {
    id: "anthropic-oauth",
    name: "Anthropic OAuth Token",
    provider: "Anthropic",
    pattern: /sk-ant-oat01-[A-Za-z0-9_-]{68}/,
    severity: "critical",
    description: "Anthropic OAuth token found in plaintext",
  },

  // OpenAI (specific before legacy)
  {
    id: "openai-api-key",
    name: "OpenAI API Key",
    provider: "OpenAI",
    pattern: /sk-proj-[A-Za-z0-9_-]{48,156}/,
    severity: "critical",
    description: "OpenAI API key found in plaintext",
  },

  // OpenRouter
  {
    id: "openrouter-api-key",
    name: "OpenRouter API Key",
    provider: "OpenRouter",
    pattern: /sk-or-v1-[a-f0-9]{64}/,
    severity: "critical",
    description: "OpenRouter API key found in plaintext",
  },

  // DeepSeek (before openai-legacy since both start with sk-)
  {
    id: "deepseek-api-key",
    name: "DeepSeek API Key",
    provider: "DeepSeek",
    pattern: /sk-[a-f0-9]{32}/,
    severity: "high",
    description: "DeepSeek API key found in plaintext",
  },

  // OpenAI legacy (after deepseek to avoid overlap)
  {
    id: "openai-api-key-legacy",
    name: "OpenAI API Key (Legacy)",
    provider: "OpenAI",
    pattern: /sk-[A-Za-z0-9]{48}/,
    severity: "critical",
    description: "Legacy OpenAI API key found in plaintext",
  },

  // Google
  {
    id: "google-api-key",
    name: "Google API Key",
    provider: "Google",
    pattern: /AIzaSy[A-Za-z0-9_-]{33}/,
    severity: "high",
    description: "Google API key found in plaintext",
  },

  // AWS
  {
    id: "aws-access-key",
    name: "AWS Access Key ID",
    provider: "AWS",
    pattern: /(?:AKIA|ASIA)[A-Z2-7]{16}/,
    severity: "critical",
    description: "AWS access key ID found in plaintext",
  },
  {
    id: "aws-secret-key",
    name: "AWS Secret Access Key",
    provider: "AWS",
    pattern: /[A-Za-z0-9/+=]{40}/,
    severity: "critical",
    description: "AWS secret access key found in plaintext",
    contextAware: true,
    contextKeywords: [
      "aws_secret",
      "secret_access_key",
      "aws_secret_access_key",
      "secretaccesskey",
    ],
    contextLines: 3,
  },

  // GitHub
  {
    id: "github-pat-fine",
    name: "GitHub Fine-Grained PAT",
    provider: "GitHub",
    pattern: /github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}/,
    severity: "high",
    description: "GitHub fine-grained personal access token found",
  },
  {
    id: "github-pat",
    name: "GitHub Personal Access Token",
    provider: "GitHub",
    pattern: /ghp_[A-Za-z0-9]{36}/,
    severity: "high",
    description: "GitHub personal access token found",
  },
  {
    id: "github-oauth",
    name: "GitHub OAuth Token",
    provider: "GitHub",
    pattern: /gho_[A-Za-z0-9]{36}/,
    severity: "high",
    description: "GitHub OAuth access token found",
  },
  {
    id: "github-app",
    name: "GitHub App Token",
    provider: "GitHub",
    pattern: /(?:ghs|ghr)_[A-Za-z0-9]{36}/,
    severity: "high",
    description: "GitHub App installation or refresh token found",
  },

  // GitLab
  {
    id: "gitlab-pat",
    name: "GitLab Personal Access Token",
    provider: "GitLab",
    pattern: /glpat-[A-Za-z0-9_-]{20}/,
    severity: "high",
    description: "GitLab personal access token found",
  },

  // Telegram
  {
    id: "telegram-bot",
    name: "Telegram Bot Token",
    provider: "Telegram",
    pattern: /[0-9]{8,10}:[A-Za-z0-9_-]{35}/,
    severity: "high",
    description: "Telegram bot token found in plaintext",
  },

  // Discord
  {
    id: "discord-bot",
    name: "Discord Bot Token",
    provider: "Discord",
    pattern: /[MNO][A-Za-z0-9_-]{23,25}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27}/,
    severity: "high",
    description: "Discord bot token found in plaintext",
  },

  // Slack
  {
    id: "slack-token",
    name: "Slack Token",
    provider: "Slack",
    pattern: /xox[bpasre]-[0-9]{10,13}-[A-Za-z0-9-]+/,
    severity: "high",
    description: "Slack API token found in plaintext",
  },
  {
    id: "slack-webhook",
    name: "Slack Webhook URL",
    provider: "Slack",
    pattern:
      /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,}\/B[A-Z0-9]{8,}\/[A-Za-z0-9]{24}/,
    severity: "medium",
    description: "Slack incoming webhook URL found",
  },

  // Stripe
  {
    id: "stripe-secret",
    name: "Stripe Secret Key",
    provider: "Stripe",
    pattern: /sk_live_[A-Za-z0-9]{24,}/,
    severity: "critical",
    description: "Stripe live secret key found in plaintext",
  },
  {
    id: "stripe-restricted",
    name: "Stripe Restricted Key",
    provider: "Stripe",
    pattern: /rk_live_[A-Za-z0-9]{24,}/,
    severity: "high",
    description: "Stripe restricted API key found in plaintext",
  },

  // Private keys
  {
    id: "private-key",
    name: "Private Key",
    provider: "Generic",
    pattern: /-----BEGIN (?:RSA|DSA|EC|PGP|OPENSSH) PRIVATE KEY-----/,
    severity: "critical",
    description: "Private key found in plaintext",
  },

  // Shell exports
  {
    id: "env-export",
    name: "Shell Export with Secret",
    provider: "Shell",
    pattern:
      /export\s+[A-Z_]*(?:KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|API)[A-Z_]*\s*=\s*['"]?[^\s'"]+/,
    severity: "medium",
    description: "Shell export containing a potential secret",
  },

  // Generic catch-all (last, lowest priority)
  {
    id: "generic-secret",
    name: "Generic Secret",
    provider: "Generic",
    pattern:
      /(?:api_key|api[-_]?secret|secret[-_]?key|access[-_]?token|auth[-_]?token|password|credential)[\s]*[=:]\s*['"]?([A-Za-z0-9_/+=-]{16,})['"]?/i,
    severity: "medium",
    description: "Potential secret value detected via keyword match",
  },
];

/** Get patterns ordered for scanning (specific first, generic last) */
export function getPatterns(): SecretPattern[] {
  return PATTERNS;
}
