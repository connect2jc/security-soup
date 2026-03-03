/** Detect the context type from the file path */
export type FileContext =
  | "openclaw-config"
  | "openclaw-auth"
  | "openclaw-env"
  | "openclaw-memory"
  | "mcp-config"
  | "env-file"
  | "shell-rc"
  | "shell-history"
  | "git-history"
  | "source-code";

export function detectFileContext(filePath: string): FileContext {
  const p = filePath.toLowerCase();
  if (p.includes("[git:")) return "git-history";
  if (p.includes(".openclaw") && p.includes("auth-profiles")) return "openclaw-auth";
  if (p.includes(".openclaw") && p.endsWith(".env")) return "openclaw-env";
  if (p.includes(".openclaw") && (p.includes("memory") || p.endsWith(".md"))) return "openclaw-memory";
  if (p.includes(".openclaw")) return "openclaw-config";
  if (p.includes("mcp") && p.endsWith(".json")) return "mcp-config";
  if (p.includes(".env")) return "env-file";
  if (p.includes("_history")) return "shell-history";
  if (p.includes(".zshrc") || p.includes(".bashrc") || p.includes(".zprofile") || p.includes(".bash_profile")) return "shell-rc";
  return "source-code";
}

/** Suggested environment variable name per pattern ID */
const envVarNames: Record<string, string> = {
  "anthropic-api-key": "ANTHROPIC_API_KEY",
  "anthropic-oauth": "ANTHROPIC_OAUTH_TOKEN",
  "openai-api-key": "OPENAI_API_KEY",
  "openai-api-key-legacy": "OPENAI_API_KEY",
  "google-api-key": "GOOGLE_API_KEY",
  "openrouter-api-key": "OPENROUTER_API_KEY",
  "aws-access-key": "AWS_ACCESS_KEY_ID",
  "aws-secret-key": "AWS_SECRET_ACCESS_KEY",
  "github-pat": "GITHUB_TOKEN",
  "github-pat-fine": "GITHUB_TOKEN",
  "github-oauth": "GITHUB_OAUTH_TOKEN",
  "github-app": "GITHUB_APP_TOKEN",
  "gitlab-pat": "GITLAB_TOKEN",
  "telegram-bot": "TELEGRAM_BOT_TOKEN",
  "discord-bot": "DISCORD_BOT_TOKEN",
  "slack-token": "SLACK_TOKEN",
  "slack-webhook": "SLACK_WEBHOOK_URL",
  "stripe-secret": "STRIPE_SECRET_KEY",
  "stripe-restricted": "STRIPE_RESTRICTED_KEY",
  "deepseek-api-key": "DEEPSEEK_API_KEY",
};

/** Where to rotate each key */
const rotationUrls: Record<string, { label: string; url: string }> = {
  "anthropic-api-key": { label: "Anthropic Console", url: "console.anthropic.com" },
  "anthropic-oauth": { label: "Anthropic Console", url: "console.anthropic.com" },
  "openai-api-key": { label: "OpenAI API Keys", url: "platform.openai.com/api-keys" },
  "openai-api-key-legacy": { label: "OpenAI API Keys", url: "platform.openai.com/api-keys" },
  "google-api-key": { label: "Google Cloud Console", url: "console.cloud.google.com/apis/credentials" },
  "openrouter-api-key": { label: "OpenRouter Keys", url: "openrouter.ai/keys" },
  "aws-access-key": { label: "AWS IAM Console", url: "console.aws.amazon.com/iam" },
  "aws-secret-key": { label: "AWS IAM Console", url: "console.aws.amazon.com/iam" },
  "github-pat": { label: "GitHub Tokens", url: "github.com/settings/tokens" },
  "github-pat-fine": { label: "GitHub Tokens", url: "github.com/settings/tokens" },
  "github-oauth": { label: "GitHub Applications", url: "github.com/settings/applications" },
  "gitlab-pat": { label: "GitLab Access Tokens", url: "gitlab.com/-/user_settings/personal_access_tokens" },
  "telegram-bot": { label: "@BotFather on Telegram", url: "" },
  "discord-bot": { label: "Discord Developer Portal", url: "discord.com/developers" },
  "slack-token": { label: "Slack App Settings", url: "api.slack.com/apps" },
  "stripe-secret": { label: "Stripe Dashboard", url: "dashboard.stripe.com/apikeys" },
  "stripe-restricted": { label: "Stripe Dashboard", url: "dashboard.stripe.com/apikeys" },
  "deepseek-api-key": { label: "DeepSeek Dashboard", url: "platform.deepseek.com" },
};

export interface FixStep {
  text: string;
  code?: string; // Code snippet to show
}

/**
 * Get context-aware fix steps.
 * The fix changes depending on WHERE the secret was found.
 */
export function getFixSteps(patternId: string, filePath: string): FixStep[] {
  const context = detectFileContext(filePath);
  const envVar = envVarNames[patternId] ?? "YOUR_SECRET";
  const rotation = rotationUrls[patternId];
  const steps: FixStep[] = [];

  // Step 1: Rotate the key (always first)
  if (rotation) {
    steps.push({
      text: `Rotate this key at ${rotation.label}${rotation.url ? ` (${rotation.url})` : ""}. The old key may already be compromised.`,
    });
  }

  // Step 2: Store securely (always)
  steps.push({
    text: `Add the new key as an environment variable in a secure location (a .env file that's in .gitignore, or your system keychain):`,
    code: `# In your .env file (make sure .env is in .gitignore!)\n${envVar}=your-new-key-here`,
  });

  // Step 3: Context-specific replacement
  switch (context) {
    case "openclaw-auth":
    case "openclaw-config":
      steps.push({
        text: `Replace the plaintext value in this JSON file with an environment variable reference. OpenClaw supports \${VAR} syntax:`,
        code: `// Before (insecure - plaintext key in config)\n"apiKey": "sk-ant-oat01-XXXXX..."\n\n// After (secure - reads from environment)\n"apiKey": "\${${envVar}}"`,
      });
      steps.push({
        text: `Make sure the environment variable is set before starting OpenClaw. You can add it to ~/.openclaw/.env:`,
        code: `# ~/.openclaw/.env\n${envVar}=your-new-key-here`,
      });
      break;

    case "openclaw-env":
      steps.push({
        text: `This .env file is in your OpenClaw directory. Make sure it has restricted permissions and is not committed to git:`,
        code: `chmod 600 ~/.openclaw/.env\n\n# Verify .openclaw/.env is in .gitignore\necho ".openclaw/.env" >> .gitignore`,
      });
      break;

    case "openclaw-memory":
      steps.push({
        text: `This secret was found in an OpenClaw memory file. Memory files can be read by AI agents. Remove the secret immediately:`,
        code: `# Remove the line containing the secret from the memory file.\n# Never paste secrets into AI conversations or memory files.`,
      });
      break;

    case "mcp-config":
      steps.push({
        text: `Replace the plaintext value in your MCP config with an environment variable reference. MCP configs support env blocks:`,
        code: `// Before (insecure)\n"env": {\n  "${envVar}": "sk-XXXXX..."\n}\n\n// After (secure - MCP reads from your shell environment)\n"env": {\n  "${envVar}": "\${${envVar}}"\n}`,
      });
      steps.push({
        text: `Set the variable in your shell profile (~/.zshrc or ~/.bashrc) so MCP clients can read it:`,
        code: `# Add to ~/.zshrc (or ~/.bashrc)\nexport ${envVar}="your-new-key-here"\n\n# Then reload your shell\nsource ~/.zshrc`,
      });
      break;

    case "env-file":
      steps.push({
        text: `This .env file contains the secret. Make sure it's never committed to git:`,
        code: `# Add to .gitignore\n.env\n.env.*\n.env.local\n.env.production\n\n# Verify it's not already tracked\ngit rm --cached .env 2>/dev/null`,
      });
      steps.push({
        text: `If this .env file is already in your git history, the old key is compromised. Rotate it (step 1) and consider cleaning git history.`,
      });
      break;

    case "shell-rc":
      steps.push({
        text: `Remove the export line from your shell config and use a .env file instead:`,
        code: `# Remove this line from ${filePath}:\n# export ${envVar}="sk-XXXXX..."\n\n# Instead, add to a .env file and load it:\n# In ${filePath}, add:\n[ -f ~/.env ] && export $(grep -v '^#' ~/.env | xargs)`,
      });
      break;

    case "shell-history":
      steps.push({
        text: `This secret was found in your shell history. It was likely pasted into a terminal command. Clear it:`,
        code: `# For zsh: edit history file and remove the line\nnano ~/.zsh_history\n# Search for the key and delete that line\n\n# For bash:\nnano ~/.bash_history`,
      });
      steps.push({
        text: `The key was typed into a terminal, so it should be considered compromised. Make sure you rotated it in step 1.`,
      });
      break;

    case "git-history":
      steps.push({
        text: `This secret is in your git history. Even if you removed it from current files, it's still in past commits. The key is compromised — rotating it (step 1) is critical.`,
      });
      steps.push({
        text: `To clean git history (optional, but recommended for shared repos):`,
        code: `# Using git-filter-repo (install: pip install git-filter-repo)\ngit filter-repo --invert-paths --path <file-with-secret>\n\n# Or use BFG Repo-Cleaner:\nbfg --replace-text passwords.txt`,
      });
      break;

    case "source-code":
    default:
      steps.push({
        text: `Replace the hardcoded value in your code with an environment variable read:`,
        code: `// Before (insecure)\nconst apiKey = "sk-XXXXX...";\n\n// After (secure)\nconst apiKey = process.env.${envVar};\nif (!apiKey) throw new Error("${envVar} not set");`,
      });
      steps.push({
        text: `Make sure the environment variable is set in your deployment environment (.env file, CI/CD secrets, or hosting platform).`,
      });
      break;
  }

  // Private key gets special treatment
  if (patternId === "private-key") {
    return [
      { text: `This is a private key — the most sensitive type of credential. If it was ever committed to git or shared, consider it compromised and regenerate it.` },
      { text: `Move the key to a secure location with restricted permissions:`, code: `mv <keyfile> ~/.ssh/\nchmod 600 ~/.ssh/<keyfile>\nchmod 700 ~/.ssh/` },
      { text: `Remove the key from this location. If it's in git history, use git-filter-repo or BFG to clean it.` },
      { text: `Update any services using this key to point to the new location.` },
    ];
  }

  // Generic secret gets simpler treatment
  if (patternId === "generic-secret") {
    return [
      { text: `First, verify if this is actually a secret (it matched a generic pattern). Check if the value is sensitive.` },
      { text: `If it is a secret, identify the provider and rotate it.` },
      { text: `Store the new value as an environment variable:`, code: `# In .env\n${envVar}=your-new-value\n\n# In code, read from environment:\nprocess.env.YOUR_SECRET` },
      { text: `Remove the plaintext value from this file.` },
    ];
  }

  return steps;
}
