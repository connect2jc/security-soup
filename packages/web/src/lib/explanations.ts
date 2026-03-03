/** Plain-English explanations per pattern ID (no jargon) */
const explanations: Record<string, string> = {
  "anthropic-api-key":
    "Your Anthropic API key is stored as readable text. Anyone who can see this file could use your account and run up charges.",
  "anthropic-oauth":
    "Your Anthropic OAuth token is stored as readable text. This token grants access to your Anthropic account.",
  "openai-api-key":
    "Your OpenAI API key is stored as readable text. Anyone who can see this file could spend money on your account.",
  "openai-api-key-legacy":
    "An older-format OpenAI API key is stored as readable text. It still works and could be used by anyone who finds it.",
  "google-api-key":
    "Your Google API key is visible in this file. Depending on its permissions, someone could access your Google services.",
  "openrouter-api-key":
    "Your OpenRouter API key is stored as readable text. Someone could use your credits through this key.",
  "aws-access-key":
    "An AWS access key is stored here. Combined with a secret key, this could give someone access to your cloud resources.",
  "aws-secret-key":
    "An AWS secret key is stored near related keywords. This is like a password for your AWS account.",
  "github-pat":
    "A GitHub personal access token is stored here. Someone could access your repositories and account with this.",
  "github-pat-fine":
    "A GitHub fine-grained token is stored here. Even though it's scoped, it could still be misused.",
  "github-oauth":
    "A GitHub OAuth token is stored here. This grants access to whatever permissions the OAuth app has.",
  "github-app":
    "A GitHub App token is stored here. This could be used to impersonate the app.",
  "gitlab-pat":
    "A GitLab personal access token is stored here. Someone could access your GitLab projects with this.",
  "telegram-bot":
    "A Telegram bot token is stored here. Someone could take control of your bot.",
  "discord-bot":
    "A Discord bot token is stored here. Someone could control your bot and access your server.",
  "slack-token":
    "A Slack token is stored here. Someone could read and send messages in your workspace.",
  "slack-webhook":
    "A Slack webhook URL is stored here. Someone could post messages to your Slack channel.",
  "stripe-secret":
    "Your Stripe live secret key is stored here. Someone could process payments and access your financial data.",
  "stripe-restricted":
    "A Stripe restricted key is stored here. Depending on its permissions, it could be used to access your Stripe account.",
  "private-key":
    "A private key file is stored here. Private keys are the most sensitive type of credential — protect them carefully.",
  "deepseek-api-key":
    "A DeepSeek API key is stored as readable text. Someone could use your account through this key.",
  "env-export":
    "A secret is being set in a shell configuration file. This means it's loaded every time you open a terminal.",
  "generic-secret":
    "A value that looks like a secret (API key, token, or password) was found. You should verify if it's sensitive.",
  "vercel-token":
    "Your Vercel deployment token is stored as readable text. Someone could deploy code to your projects or access your infrastructure.",
  "railway-token":
    "Your Railway API token is stored as readable text. Someone could manage your Railway services, databases, and deployments.",
  "convex-deploy-key":
    "Your Convex backend deploy key is stored as readable text. Someone could access your database and modify your backend.",
  "brave-api-key":
    "Your Brave Search API key is stored as readable text. Someone could use your search quota.",
  "supabase-key":
    "Your Supabase key is stored as readable text. Depending on its role (anon vs service_role), someone could access your database.",
};

export function getExplanation(patternId: string): string {
  return (
    explanations[patternId] ??
    "A potential secret was found in this file. Review it to make sure it's not sensitive."
  );
}
