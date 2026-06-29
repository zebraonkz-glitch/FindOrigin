import { getTelegramBotToken } from "@/lib/env";

const TELEGRAM_API_BASE = "https://api.telegram.org";
const REQUEST_TIMEOUT_MS = 10_000;

type SendMessageOptions = {
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
};

export async function sendMessage(
  chatId: number,
  text: string,
  options: SendMessageOptions = {},
): Promise<void> {
  const token = getTelegramBotToken();

  try {
    await sendMessageRequest(token, chatId, text, options.parseMode);
  } catch (error) {
    if (options.parseMode) {
      console.warn("[telegram] HTML send failed, retrying as plain text", error);
      await sendMessageRequest(token, chatId, text);
      return;
    }
    throw error;
  }
}

async function sendMessageRequest(
  token: string,
  chatId: number,
  text: string,
  parseMode?: SendMessageOptions["parseMode"],
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...(parseMode ? { parse_mode: parseMode } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram sendMessage failed (${response.status}): ${body}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}
