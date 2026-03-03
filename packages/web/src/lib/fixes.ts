/** Step-by-step fix instructions per pattern ID */
const fixes: Record<string, string[]> = {
  "anthropic-api-key": [
    "Go to console.anthropic.com and rotate your API key",
    "Store the new key in an environment variable: export ANTHROPIC_API_KEY=your-new-key",
    "Update your app to read from the environment: process.env.ANTHROPIC_API_KEY",
    "Remove the old key from this file",
  ],
  "anthropic-oauth": [
    "Go to console.anthropic.com and rotate the OAuth token",
    "Store the new token in a secure credential store",
    "Remove the old token from this file",
  ],
  "openai-api-key": [
    "Go to platform.openai.com/api-keys and create a new key",
    "Delete the old key immediately",
    "Store the new key in an environment variable: export OPENAI_API_KEY=your-new-key",
    "Remove the key from this file",
  ],
  "openai-api-key-legacy": [
    "Go to platform.openai.com/api-keys and create a new project-scoped key",
    "Delete this legacy key",
    "Store the new key in an environment variable",
    "Remove the key from this file",
  ],
  "google-api-key": [
    "Go to Google Cloud Console > APIs & Services > Credentials",
    "Restrict the key to specific APIs and IP addresses",
    "Store it in an environment variable instead of this file",
  ],
  "openrouter-api-key": [
    "Go to openrouter.ai/keys and create a new key",
    "Delete the exposed key",
    "Store the new key in an environment variable",
  ],
  "aws-access-key": [
    "Go to AWS IAM Console and deactivate this access key",
    "Create a new key pair",
    "Use aws configure or environment variables instead of hardcoding",
  ],
  "aws-secret-key": [
    "Rotate the AWS key pair in IAM Console immediately",
    "Use aws configure to store credentials properly",
    "Remove the secret from this file",
  ],
  "github-pat": [
    "Go to github.com/settings/tokens and delete this token",
    "Create a new fine-grained token with minimal permissions",
    "Store it in an environment variable: export GITHUB_TOKEN=your-new-token",
  ],
  "github-pat-fine": [
    "Go to github.com/settings/tokens and regenerate this token",
    "Store the new token in an environment variable",
    "Remove it from this file",
  ],
  "github-oauth": [
    "Revoke this token at github.com/settings/applications",
    "Store OAuth tokens in a secure backend, never in config files",
  ],
  "github-app": [
    "Regenerate the token via your GitHub App settings",
    "Store it securely, never in plaintext files",
  ],
  "gitlab-pat": [
    "Go to GitLab > User Settings > Access Tokens and revoke this token",
    "Create a new token with minimal scopes",
    "Store it in an environment variable",
  ],
  "telegram-bot": [
    "Message @BotFather on Telegram and use /revoke to reset the token",
    "Store the new token in an environment variable",
  ],
  "discord-bot": [
    "Go to discord.com/developers and regenerate your bot token",
    "Store the new token in an environment variable",
  ],
  "slack-token": [
    "Go to api.slack.com/apps and rotate the token",
    "Store the new token in an environment variable",
  ],
  "slack-webhook": [
    "Consider regenerating the webhook URL in your Slack app settings",
    "Store the URL in an environment variable",
  ],
  "stripe-secret": [
    "Go to dashboard.stripe.com/apikeys immediately",
    "Roll the secret key (this will invalidate the old one)",
    "Store the new key in an environment variable: export STRIPE_SECRET_KEY=...",
  ],
  "stripe-restricted": [
    "Go to dashboard.stripe.com/apikeys and manage restricted keys",
    "Store the key in an environment variable",
  ],
  "private-key": [
    "Move the key file to a secure location (e.g., ~/.ssh/)",
    "Set permissions: chmod 600 on the key file",
    "Remove it from this file/directory",
    "If this key was committed to git, consider it compromised and regenerate it",
  ],
  "deepseek-api-key": [
    "Rotate your DeepSeek API key",
    "Store the new key in an environment variable",
    "Remove the key from this file",
  ],
  "env-export": [
    "Move the secret to a .env file (and add .env to .gitignore)",
    "Use a tool like dotenv to load environment variables",
    "Remove the export line from your shell config",
  ],
  "generic-secret": [
    "Verify if this value is actually a secret",
    "If it is, move it to an environment variable or secret manager",
    "Remove it from this file",
  ],
};

export function getFixSteps(patternId: string): string[] {
  return (
    fixes[patternId] ?? [
      "Identify the secret's provider and rotate it",
      "Store the new value in an environment variable",
      "Remove the old value from this file",
    ]
  );
}
