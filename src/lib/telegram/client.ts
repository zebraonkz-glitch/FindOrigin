import { getTelegramBotToken } from "@/lib/env";

const TELEGRAM_API_BASE = "https://api.telegram.org";
const REQUEST_TIMEOUT_MS = 10_000;

type InlineKeyboardButton = {
  text: string;
  url?: string;
  web_app?: { url: string };
};

type ReplyMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

type SendMessageOptions = {
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  replyMarkup?: ReplyMarkup;
};

export async function sendMessage(
  chatId: number,
  text: string,
  options: SendMessageOptions = {},
): Promise<void> {
  const token = getTelegramBotToken();

  try {
    await sendMessageRequest(token, chatId, text, options);
  } catch (error) {
    if (options.parseMode) {
      console.warn("[telegram] HTML send failed, retrying as plain text", error);
      await sendMessageRequest(token, chatId, text, {
        replyMarkup: options.replyMarkup,
      });
      return;
    }
    throw error;
  }
}

async function sendMessageRequest(
  token: string,
  chatId: number,
  text: string,
  options: SendMessageOptions = {},
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
        ...(options.parseMode ? { parse_mode: options.parseMode } : {}),
        ...(options.replyMarkup ? { reply_markup: options.replyMarkup } : {}),
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
