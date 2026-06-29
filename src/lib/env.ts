function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Переменная окружения ${name} не задана`);
  }
  return value;
}

export function getTelegramBotToken(): string {
  return requireEnv("TELEGRAM_BOT_TOKEN");
}

export function getTelegramWebhookSecret(): string | undefined {
  return process.env.TELEGRAM_WEBHOOK_SECRET;
}

export function getOpenAiApiKey(): string {
  const key = process.env.OPENAI_API_KEY ?? process.env.OPENROUTER_API_KEY;
  if (key) {
    return key;
  }
  return requireEnv("OPENAI_API_KEY");
}

export function getSearchApiKey(): string {
  const key = process.env.SEARCH_API_KEY ?? process.env.SERPER_API_KEY;
  if (key) {
    return key;
  }
  return requireEnv("SEARCH_API_KEY");
}

export function getOpenAiBaseUrl(): string {
  return process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1";
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL ?? "openai/gpt-4o-mini";
}

export const MIN_INPUT_TEXT_LENGTH = 10;
