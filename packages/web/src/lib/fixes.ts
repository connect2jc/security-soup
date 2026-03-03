import type { Platform } from "../api";

/** Detect the context type from the file path */
export type FileContext =
  | "openclaw-config"
  | "openclaw-auth"
  | "openclaw-credentials"
  | "openclaw-device"
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
  if (p.includes(".openclaw") && p.includes("credentials")) return "openclaw-credentials";
  if (p.includes(".openclaw") && (p.includes("identity") || p.includes("devices"))) return "openclaw-device";
  if (p.includes(".openclaw") && p.endsWith(".env")) return "openclaw-env";
  if (p.includes(".openclaw") && (p.includes("memory") || p.endsWith(".md"))) return "openclaw-memory";
  if (p.includes(".openclaw")) return "openclaw-config";
  if (p.includes("mcp") && p.endsWith(".json")) return "mcp-config";
  if (p.includes(".env")) return "env-file";
  if (p.includes("_history") || p.includes("psreadline")) return "shell-history";
  if (p.includes(".zshrc") || p.includes(".bashrc") || p.includes(".zprofile") || p.includes(".bash_profile") || p.includes("profile.ps1")) return "shell-rc";
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
  "vercel-token": "VERCEL_TOKEN",
  "railway-token": "RAILWAY_TOKEN",
  "convex-deploy-key": "CONVEX_DEPLOY_KEY",
  "brave-api-key": "BRAVE_SEARCH_API_KEY",
  "supabase-key": "SUPABASE_KEY",
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
  "vercel-token": { label: "Vercel Tokens", url: "vercel.com/account/tokens" },
  "railway-token": { label: "Railway Tokens", url: "railway.com/account/tokens" },
  "convex-deploy-key": { label: "Convex Dashboard", url: "dashboard.convex.dev" },
  "brave-api-key": { label: "Brave Search API", url: "brave.com/search/api" },
  "supabase-key": { label: "Supabase Dashboard", url: "supabase.com/dashboard" },
};

export interface FixStep {
  text: string;
  code?: string;
  type?: "warning" | "info" | "secure"; // Visual hint for the step
}

// ─── Platform-aware secure storage steps ───────────────────────────────

function getSecureStorageStep(envVar: string, platform: Platform): FixStep {
  switch (platform) {
    case "darwin":
      return {
        text: `Store the new key in your macOS Keychain (encrypted, not plaintext). This is the most secure option for local development:`,
        type: "secure",
        code: [
          `# Save the key to macOS Keychain`,
          `security add-generic-password -a "$USER" -s "${envVar}" \\`,
          `  -w "your-new-key-here" -U`,
          ``,
          `# To retrieve it later (for verification):`,
          `security find-generic-password -a "$USER" -s "${envVar}" -w`,
        ].join("\n"),
      };

    case "win32":
      return {
        text: `Store the new key in Windows Credential Manager (encrypted, not plaintext). This is the most secure option for local development:`,
        type: "secure",
        code: [
          `# Save the key to Windows Credential Manager (PowerShell)`,
          `$cred = New-Object System.Management.Automation.PSCredential(`,
          `  "${envVar}",`,
          `  (ConvertTo-SecureString "your-new-key-here" -AsPlainText -Force)`,
          `)`,
          `New-StoredCredential -Target "${envVar}" -Credential $cred -Persist LocalMachine`,
          ``,
          `# Or use the built-in cmdkey:`,
          `cmdkey /generic:${envVar} /user:${envVar} /pass:your-new-key-here`,
          ``,
          `# To retrieve it later (for verification):`,
          `cmdkey /list:${envVar}`,
        ].join("\n"),
      };

    case "linux":
    default:
      return {
        text: `Store the new key in your system keyring using secret-tool (encrypted via GNOME Keyring or KDE Wallet). This is the most secure option for local development:`,
        type: "secure",
        code: [
          `# Save the key to the system keyring (you'll be prompted for the value)`,
          `secret-tool store --label="${envVar}" service securesecrets key "${envVar}"`,
          ``,
          `# To retrieve it later (for verification):`,
          `secret-tool lookup service securesecrets key "${envVar}"`,
          ``,
          `# If secret-tool is not installed:`,
          `# Ubuntu/Debian: sudo apt install libsecret-tools`,
          `# Fedora: sudo dnf install libsecret`,
          `# Arch: sudo pacman -S libsecret`,
        ].join("\n"),
      };
  }
}

function getShellLoaderStep(envVar: string, platform: Platform): FixStep {
  switch (platform) {
    case "darwin":
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

    case "win32":
      return {
        text: `Add this to your PowerShell profile so the key is loaded from Credential Manager into your environment automatically:`,
        code: [
          `# Add to your PowerShell profile ($PROFILE)`,
          `# Open it with: notepad $PROFILE`,
          ``,
          `$cred = Get-StoredCredential -Target "${envVar}"`,
          `if ($cred) {`,
          `  $env:${envVar} = $cred.GetNetworkCredential().Password`,
          `}`,
          ``,
          `# Alternative using cmdkey + PowerShell:`,
          `$env:${envVar} = (cmdkey /list:${envVar} | Select-String "Password").ToString().Split(":")[-1].Trim()`,
          ``,
          `# Then reload your profile`,
          `. $PROFILE`,
        ].join("\n"),
      };

    case "linux":
    default:
      return {
        text: `Add this line to your ~/.bashrc (or ~/.zshrc) so the key is loaded from the system keyring into your environment automatically:`,
        code: [
          `# Add to ~/.bashrc (or ~/.zshrc)`,
          `export ${envVar}=$(secret-tool lookup service securesecrets key "${envVar}" 2>/dev/null)`,
          ``,
          `# Then reload your shell`,
          `source ~/.bashrc`,
        ].join("\n"),
      };
  }
}

/**
 * Alternative: 1Password / Bitwarden CLI for teams or if user prefers.
 */
function getPasswordManagerStep(envVar: string, platform: Platform): FixStep {
  const exportCmd = platform === "win32" ? "$env:" : "export ";
  const assignOp = platform === "win32" ? " = " : "=";

  return {
    text: `Alternative: If you use a password manager like 1Password or Bitwarden, you can load secrets from there instead:`,
    code: [
      `# 1Password CLI (op)`,
      `${exportCmd}${envVar}${assignOp}$(op read "op://Vault/Item/${envVar}")`,
      ``,
      `# Bitwarden CLI (bw)`,
      `${exportCmd}${envVar}${assignOp}$(bw get password ${envVar})`,
    ].join("\n"),
  };
}

// ─── Shell config path helper ──────────────────────────────────────────

function shellConfigName(platform: Platform): string {
  return platform === "win32" ? "PowerShell profile ($PROFILE)" : "~/.zshrc (or ~/.bashrc)";
}

// ─── Main fix steps generator ──────────────────────────────────────────

/**
 * Get context-aware, platform-aware fix steps.
 */
export function getFixSteps(patternId: string, filePath: string, platform: Platform = "darwin"): FixStep[] {
  const context = detectFileContext(filePath);
  const envVar = envVarNames[patternId] ?? "YOUR_SECRET";
  const rotation = rotationUrls[patternId];

  // Private key gets special treatment
  if (patternId === "private-key") {
    const steps: FixStep[] = [
      {
        text: `This is a private key — the most sensitive type of credential. If it was ever committed to git or shared, consider it compromised and regenerate it.`,
        type: "warning",
      },
    ];

    if (platform === "win32") {
      steps.push({
        text: `Move the key to your user's .ssh folder with restricted permissions:`,
        code: `Move-Item <keyfile> $env:USERPROFILE\\.ssh\\\nicacls $env:USERPROFILE\\.ssh\\<keyfile> /inheritance:r /grant:r "$env:USERNAME:(R)"`,
      });
    } else {
      steps.push({
        text: `Move the key to ~/.ssh/ with locked-down permissions (only your user can read it):`,
        code: `mv <keyfile> ~/.ssh/\nchmod 600 ~/.ssh/<keyfile>\nchmod 700 ~/.ssh/`,
      });
    }

    steps.push(
      { text: `Remove the key from this location. If it's in git history, use git-filter-repo or BFG to scrub it.` },
      { text: `Update any services using this key to point to the new ${platform === "win32" ? "%USERPROFILE%\\.ssh\\" : "~/.ssh/"} location.` },
    );
    return steps;
  }

  // Generic secret gets simpler treatment
  if (patternId === "generic-secret") {
    return [
      { text: `First, verify if this is actually a secret (it matched a generic pattern). Check if the value is sensitive.` },
      { text: `If it is a secret, identify the provider and rotate it.` },
      getSecureStorageStep(envVar, platform),
      getShellLoaderStep(envVar, platform),
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

  // Step 2: Store in OS credential store (actually secure, not just another file)
  steps.push(getSecureStorageStep(envVar, platform));

  // Step 3: Load from credential store into shell environment
  steps.push(getShellLoaderStep(envVar, platform));

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
          `// After (secure — resolved from credential store via your shell env)`,
          `"apiKey": "\${${envVar}}"`,
        ].join("\n"),
      });
      steps.push({
        text: `Delete the plaintext key from this file. When OpenClaw starts, it will read ${envVar} from your environment, which your shell loaded from ${platform === "darwin" ? "Keychain" : platform === "win32" ? "Credential Manager" : "the system keyring"}.`,
        type: "info",
      });
      break;

    case "openclaw-credentials":
      steps.push({
        text: `This secret is in the OpenClaw credentials directory — plaintext service tokens. Move it to your ${platform === "darwin" ? "Keychain" : platform === "win32" ? "Credential Manager" : "system keyring"} and update OpenClaw to use an environment variable reference:`,
        code: platform === "win32"
          ? `# Delete the credential file after storing in Credential Manager\nRemove-Item "${filePath}"\n\n# Update OpenClaw config to use environment variable:\n# "apiKey": "\${${envVar}}"`
          : `# Delete the credential file after storing in ${platform === "darwin" ? "Keychain" : "keyring"}\nrm "${filePath}"\n\n# Update OpenClaw config to use environment variable:\n# "apiKey": "\${${envVar}}"`,
        type: "warning",
      });
      break;

    case "openclaw-device":
      steps.push({
        text: `This is a device pairing token with operator-level access. If this device is no longer in use or you don't recognize it, revoke it immediately:`,
        code: `# Review paired devices\nopenclaw devices list\n\n# Revoke any unrecognized device\nopenclaw devices revoke <device-id>\n\n# Disable auto-approval for new devices\n# In openclaw.json, set:\n# "pairing": { "autoApprove": false }`,
        type: "warning",
      });
      break;

    case "openclaw-env":
      steps.push({
        text: `Since the key is now in your ${platform === "darwin" ? "Keychain" : platform === "win32" ? "Credential Manager" : "system keyring"} and loaded via ${shellConfigName(platform)}, you can remove it from this .env file entirely. If you prefer to keep the .env approach, at least lock down permissions:`,
        code: platform === "win32"
          ? `# Option A: Remove from .env (best — key lives in Credential Manager)\n# Just delete the ${envVar}=... line\n\n# Option B: Keep .env but restrict access\nicacls .env /inheritance:r /grant:r "$env:USERNAME:(R)"`
          : `# Option A: Remove from .env (best — key lives in ${platform === "darwin" ? "Keychain" : "keyring"})\n# Just delete the ${envVar}=... line\n\n# Option B: Keep .env but restrict access\nchmod 600 ~/.openclaw/.env`,
      });
      break;

    case "openclaw-memory":
      steps.push({
        text: `This secret is in an OpenClaw memory file — AI agents can read these. Remove it immediately:`,
        type: "warning",
        code: `# Remove the line containing the secret from the memory file.\n# Never paste secrets into AI conversations or memory files.\n# The key now lives safely in your ${platform === "darwin" ? "Keychain" : platform === "win32" ? "Credential Manager" : "system keyring"} instead.`,
      });
      break;

    case "mcp-config":
      steps.push({
        text: `Update your MCP config to read from the environment variable (which your shell loads from ${platform === "darwin" ? "Keychain" : platform === "win32" ? "Credential Manager" : "the keyring"}):`,
        code: [
          `// Before (insecure — key hardcoded in config)`,
          `"env": {`,
          `  "${envVar}": "sk-XXXXX..."`,
          `}`,
          ``,
          `// After (secure — MCP reads from shell environment)`,
          `// Simply remove the hardcoded value.`,
          `// MCP servers inherit env vars from your shell,`,
          `// which loads ${envVar} from ${platform === "darwin" ? "Keychain" : platform === "win32" ? "Credential Manager" : "the keyring"} automatically.`,
        ].join("\n"),
      });
      break;

    case "env-file":
      steps.push({
        text: `Since the key is now in your ${platform === "darwin" ? "Keychain" : platform === "win32" ? "Credential Manager" : "system keyring"}, you can remove it from this .env file. If you must keep a .env file (e.g. for Docker), make sure it never gets committed:`,
        code: platform === "win32"
          ? `# Add to .gitignore\n.env\n.env.*\n.env.local\n.env.production\n\n# Remove from git tracking if already committed\ngit rm --cached .env 2>$null\n\n# Restrict file permissions\nicacls .env /inheritance:r /grant:r "$env:USERNAME:(R)"`
          : `# Add to .gitignore\n.env\n.env.*\n.env.local\n.env.production\n\n# Remove from git tracking if already committed\ngit rm --cached .env 2>/dev/null\n\n# Restrict file permissions\nchmod 600 .env`,
      });
      steps.push({
        text: `If this .env was ever committed to git, the old key is compromised regardless. That's why step 1 (rotate) is critical.`,
        type: "warning",
      });
      break;

    case "shell-rc":
      if (platform === "win32") {
        steps.push({
          text: `Remove the hardcoded value from your PowerShell profile — the Credential Manager loader from step 3 replaces it:`,
          code: [
            `# Remove this line from your $PROFILE:`,
            `$env:${envVar} = "sk-XXXXX..."  # <- DELETE THIS`,
            ``,
            `# The Credential Manager loader you added in step 3 replaces it.`,
            `# The difference: the old line had the key in plaintext on disk.`,
            `# The new line reads it from encrypted Credential Manager at shell startup.`,
          ].join("\n"),
        });
      } else {
        steps.push({
          text: `Remove the hardcoded export from your shell config — the ${platform === "darwin" ? "Keychain" : "keyring"} loader line from step 3 replaces it:`,
          code: [
            `# Remove this line from ${filePath}:`,
            `export ${envVar}="sk-XXXXX..."  # <- DELETE THIS`,
            ``,
            `# The ${platform === "darwin" ? "Keychain" : "keyring"} loader you added in step 3 replaces it.`,
            `# The difference: the old line had the key in plaintext on disk.`,
            `# The new line reads it from encrypted ${platform === "darwin" ? "Keychain" : "keyring"} at shell startup.`,
          ].join("\n"),
        });
      }
      break;

    case "shell-history":
      if (platform === "win32") {
        steps.push({
          text: `This secret was pasted into a terminal and is now in your PowerShell history. Clear it:`,
          code: [
            `# Clear the history file`,
            `$histPath = (Get-PSReadLineOption).HistorySavePath`,
            `$lines = Get-Content $histPath | Where-Object { $_ -notmatch '${envVar}|sk-ant|sk-proj|sk-or' }`,
            `$lines | Set-Content $histPath`,
            ``,
            `# Reload history`,
            `Remove-Module PSReadLine; Import-Module PSReadLine`,
          ].join("\n"),
        });
      } else {
        steps.push({
          text: `This secret was pasted into a terminal and is now in your shell history file. Clear it:`,
          code: `# For zsh:\nLC_ALL=C sed -i '' '/${envVar}\\|sk-ant\\|sk-proj\\|sk-or/d' ~/.zsh_history\n\n# For bash:\nLC_ALL=C sed -i '' '/${envVar}\\|sk-ant\\|sk-proj\\|sk-or/d' ~/.bash_history\n\n# Then reload history\nfc -R`,
        });
      }
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
    default: {
      const readEnv = platform === "win32"
        ? `const apiKey = process.env.${envVar};\nif (!apiKey) throw new Error("${envVar} not set — add it to Credential Manager");`
        : `const apiKey = process.env.${envVar};\nif (!apiKey) throw new Error("${envVar} not set — add it to your ${platform === "darwin" ? "Keychain" : "system keyring"}");`;
      steps.push({
        text: `Replace the hardcoded value in your code with an environment variable read:`,
        code: [
          `// Before (insecure — key in source code)`,
          `const apiKey = "sk-XXXXX...";`,
          ``,
          `// After (secure — read from environment)`,
          readEnv,
        ].join("\n"),
      });
      break;
    }
  }

  // Final step: password manager alternative for teams
  steps.push(getPasswordManagerStep(envVar, platform));

  return steps;
}
