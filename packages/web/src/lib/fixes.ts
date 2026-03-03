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
  code?: string;
  type?: "warning" | "info" | "secure"; // Visual hint for the step
}

/**
 * Get the secure storage step — uses OS keychain, not just another plaintext file.
 */
function getSecureStorageStep(envVar: string): FixStep {
  return {
    text: `Store the new key in your macOS Keychain (encrypted, not plaintext). This is the most secure option for local development:`,
    type: "secure",
    code: [
      `# Save the key to macOS Keychain (you'll be prompted for the value)`,
      `security add-generic-password -a "$USER" -s "${envVar}" \\`,
      `  -w "your-new-key-here" -U`,
      ``,
      `# To retrieve it later (for verification):`,
      `security find-generic-password -a "$USER" -s "${envVar}" -w`,
    ].join("\n"),
  };
}

/**
 * Get the shell loader step — loads from Keychain into env var on shell start.
 */
function getKeychainLoaderStep(envVar: string): FixStep {
  return {
    text: `Add this line to your ~/.zshrc so the key is loaded from Keychain into your environment automatically (never stored as plaintext on disk):`,
    code: [
      `# Add to ~/.zshrc (or ~/.bashrc)`,
      `export ${envVar}=$(security find-generic-password -a "$USER" -s "${envVar}" -w 2>/dev/null)`,
      ``,
      `# Then reload your shell`,
      `source ~/.zshrc`,
    ].join("\n"),
  };
}

/**
 * Alternative: 1Password / Bitwarden CLI for teams or if user prefers.
 */
function getPasswordManagerStep(envVar: string): FixStep {
  return {
    text: `Alternative: If you use a password manager like 1Password or Bitwarden, you can load secrets from there instead:`,
    code: [
      `# 1Password CLI (op)`,
      `export ${envVar}=$(op read "op://Vault/Item/${envVar}")`,
      ``,
      `# Bitwarden CLI (bw)`,
      `export ${envVar}=$(bw get password ${envVar})`,
    ].join("\n"),
  };
}

/**
 * Get context-aware fix steps.
 * The fix changes depending on WHERE the secret was found.
 */
export function getFixSteps(patternId: string, filePath: string): FixStep[] {
  const context = detectFileContext(filePath);
  const envVar = envVarNames[patternId] ?? "YOUR_SECRET";
  const rotation = rotationUrls[patternId];

  // Private key gets special treatment
  if (patternId === "private-key") {
    return [
      {
        text: `This is a private key — the most sensitive type of credential. If it was ever committed to git or shared, consider it compromised and regenerate it.`,
        type: "warning",
      },
      {
        text: `Move the key to ~/.ssh/ with locked-down permissions (only your user can read it):`,
        code: `mv <keyfile> ~/.ssh/\nchmod 600 ~/.ssh/<keyfile>\nchmod 700 ~/.ssh/`,
      },
      {
        text: `Remove the key from this location. If it's in git history, use git-filter-repo or BFG to scrub it.`,
      },
      {
        text: `Update any services using this key to point to the new ~/.ssh/ location.`,
      },
    ];
  }

  // Generic secret gets simpler treatment
  if (patternId === "generic-secret") {
    return [
      { text: `First, verify if this is actually a secret (it matched a generic pattern). Check if the value is sensitive.` },
      { text: `If it is a secret, identify the provider and rotate it.` },
      getSecureStorageStep(envVar),
      getKeychainLoaderStep(envVar),
      { text: `Remove the plaintext value from this file.` },
    ];
  }

  const steps: FixStep[] = [];

  // Step 1: Rotate the key (always first)
  if (rotation) {
    steps.push({
      text: `Rotate this key at ${rotation.label}${rotation.url ? ` (${rotation.url})` : ""} immediately. The old key should be considered compromised.`,
      type: "warning",
    });
  }

  // Step 2: Store in OS Keychain (actually secure, not just another file)
  steps.push(getSecureStorageStep(envVar));

  // Step 3: Load from Keychain into shell environment
  steps.push(getKeychainLoaderStep(envVar));

  // Step 4+: Context-specific wiring
  switch (context) {
    case "openclaw-auth":
    case "openclaw-config":
      steps.push({
        text: `Now replace the plaintext value in this config file with an environment variable reference. OpenClaw reads \${VAR} from your environment:`,
        code: [
          `// Before (insecure — plaintext key sitting on disk)`,
          `"apiKey": "sk-ant-oat01-XXXXX..."`,
          ``,
          `// After (secure — resolved from Keychain via your shell env)`,
          `"apiKey": "\${${envVar}}"`,
        ].join("\n"),
      });
      steps.push({
        text: `Delete the plaintext key from this file. When OpenClaw starts, it will read ${envVar} from your environment, which your shell loaded from Keychain.`,
        type: "info",
      });
      break;

    case "openclaw-env":
      steps.push({
        text: `Since the key is now in your Keychain and loaded via ~/.zshrc, you can remove it from this .env file entirely. If you prefer to keep the .env approach, at least lock down permissions:`,
        code: `# Option A: Remove from .env (best — key lives in Keychain)\n# Just delete the ${envVar}=... line\n\n# Option B: Keep .env but restrict access\nchmod 600 ~/.openclaw/.env`,
      });
      break;

    case "openclaw-memory":
      steps.push({
        text: `This secret is in an OpenClaw memory file — AI agents can read these. Remove it immediately:`,
        type: "warning",
        code: `# Remove the line containing the secret from the memory file.\n# Never paste secrets into AI conversations or memory files.\n# The key now lives safely in your Keychain instead.`,
      });
      break;

    case "mcp-config":
      steps.push({
        text: `Update your MCP config to read from the environment variable (which your shell loads from Keychain):`,
        code: [
          `// Before (insecure — key hardcoded in config)`,
          `"env": {`,
          `  "${envVar}": "sk-XXXXX..."`,
          `}`,
          ``,
          `// After (secure — MCP reads from shell environment)`,
          `// Simply remove the hardcoded value.`,
          `// MCP servers inherit env vars from your shell,`,
          `// which loads ${envVar} from Keychain automatically.`,
        ].join("\n"),
      });
      break;

    case "env-file":
      steps.push({
        text: `Since the key is now in your Keychain, you can remove it from this .env file. If you must keep a .env file (e.g. for Docker), make sure it never gets committed:`,
        code: `# Add to .gitignore\n.env\n.env.*\n.env.local\n.env.production\n\n# Remove from git tracking if already committed\ngit rm --cached .env 2>/dev/null\n\n# Restrict file permissions\nchmod 600 .env`,
      });
      steps.push({
        text: `If this .env was ever committed to git, the old key is compromised regardless. That's why step 1 (rotate) is critical.`,
        type: "warning",
      });
      break;

    case "shell-rc":
      steps.push({
        text: `Remove the hardcoded export from your shell config — the Keychain loader line from step 3 replaces it:`,
        code: [
          `# Remove this line from ${filePath}:`,
          `export ${envVar}="sk-XXXXX..."  # <- DELETE THIS`,
          ``,
          `# The Keychain loader you added in step 3 replaces it:`,
          `export ${envVar}=$(security find-generic-password -a "$USER" -s "${envVar}" -w 2>/dev/null)`,
          ``,
          `# The difference: the old line had the key in plaintext on disk.`,
          `# The new line reads it from encrypted Keychain at shell startup.`,
        ].join("\n"),
      });
      break;

    case "shell-history":
      steps.push({
        text: `This secret was pasted into a terminal and is now in your shell history file. Clear it:`,
        code: `# For zsh:\nLC_ALL=C sed -i '' '/${envVar}\\|sk-ant\\|sk-proj\\|sk-or/d' ~/.zsh_history\n\n# For bash:\nLC_ALL=C sed -i '' '/${envVar}\\|sk-ant\\|sk-proj\\|sk-or/d' ~/.bash_history\n\n# Then reload history\nfc -R`,
      });
      steps.push({
        text: `The key was visible in a terminal, so it should be considered compromised. Make sure you rotated it in step 1.`,
        type: "warning",
      });
      break;

    case "git-history":
      steps.push({
        text: `This secret is baked into your git history — anyone who clones the repo can see it. Rotating (step 1) is mandatory, not optional.`,
        type: "warning",
      });
      steps.push({
        text: `To scrub the secret from git history (recommended for shared/public repos):`,
        code: `# Using git-filter-repo (install: pip install git-filter-repo)\ngit filter-repo --invert-paths --path <file-with-secret>\n\n# Or BFG Repo-Cleaner (faster for large repos):\nbfg --replace-text passwords.txt\n\n# Then force-push (coordinate with your team first!)\ngit push --force --all`,
      });
      break;

    case "source-code":
    default:
      steps.push({
        text: `Replace the hardcoded value in your code with an environment variable read:`,
        code: [
          `// Before (insecure — key in source code)`,
          `const apiKey = "sk-XXXXX...";`,
          ``,
          `// After (secure — read from environment, loaded from Keychain)`,
          `const apiKey = process.env.${envVar};`,
          `if (!apiKey) throw new Error("${envVar} not set — add it to your Keychain");`,
        ].join("\n"),
      });
      break;
  }

  // Final step: password manager alternative for teams
  steps.push(getPasswordManagerStep(envVar));

  return steps;
}
