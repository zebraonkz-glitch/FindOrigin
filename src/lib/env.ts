function stripEnvValue(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

function requireEnv(name: string): string {
  const raw = process.env[name];
  if (!raw) {
    throw new Error(`Переменная окружения ${name} не задана`);
  }
  return stripEnvValue(raw);
}

function optionalEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) {
    return undefined;
  }
  return stripEnvValue(raw);
}

export function getTelegramBotToken(): string {
  return requireEnv("TELEGRAM_BOT_TOKEN");
}

export function getTelegramWebhookSecret(): string | undefined {
  return optionalEnv("TELEGRAM_WEBHOOK_SECRET");
}

export function getOpenAiApiKey(): string {
  const key = optionalEnv("OPENAI_API_KEY") ?? optionalEnv("OPENROUTER_API_KEY");
  if (key) {
    return key;
  }
  return requireEnv("OPENAI_API_KEY");
}

export function getSearchApiKey(): string | undefined {
  return optionalEnv("SEARCH_API_KEY") ?? optionalEnv("SERPER_API_KEY");
}

export function getGoogleSearchApiKey(): string | undefined {
  return optionalEnv("GOOGLE_SEARCH_API_KEY");
}

export function getGoogleSearchEngineId(): string | undefined {
  return optionalEnv("GOOGLE_SEARCH_ENGINE_ID");
}

export function hasSerperSearch(): boolean {
  return Boolean(getSearchApiKey());
}

export function hasGoogleSearch(): boolean {
  return Boolean(getGoogleSearchApiKey() && getGoogleSearchEngineId());
}

export function getOpenAiBaseUrl(): string {
  return optionalEnv("OPENAI_BASE_URL") ?? "https://openrouter.ai/api/v1";
}

export function getOpenAiModel(): string {
  return optionalEnv("OPENAI_MODEL") ?? "openai/gpt-4o-mini";
}

export function getMiniAppUrl(): string {
  const explicit = optionalEnv("MINI_APP_URL");
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const webhook = optionalEnv("WEBHOOK_URL");
  if (webhook) {
    return webhook.replace(/\/api\/webhook\/?$/, "");
  }

  return "https://find-origin-one.vercel.app";
}

export const MIN_INPUT_TEXT_LENGTH = 10;
