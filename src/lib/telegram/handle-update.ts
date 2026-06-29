import { waitUntil } from "@vercel/functions";
import { getTelegramWebhookSecret } from "@/lib/env";
import { runFindOriginPipeline } from "@/lib/pipeline/run";
import { sendMessage } from "@/lib/telegram/client";
import { parseTelegramUpdate } from "@/lib/telegram/parse";

const ACK_MESSAGE = "Принято. Ищу возможные источники…";
const NON_TEXT_MESSAGE =
  "Отправьте текст или ссылку на Telegram-пост (https://t.me/channel/123).";

export function runInBackground(task: Promise<unknown>): void {
  if (process.env.VERCEL) {
    waitUntil(task);
    return;
  }

  void task.catch((error: unknown) => {
    console.error("[background] unhandled error", error);
  });
}

export function verifyWebhookSecret(request: Request): boolean {
  const secret = getTelegramWebhookSecret();
  if (!secret) {
    return true;
  }
  return request.headers.get("X-Telegram-Bot-Api-Secret-Token") === secret;
}

export async function handleTelegramUpdate(body: unknown): Promise<void> {
  const message = parseTelegramUpdate(body);

  if (!message) {
    console.warn("[telegram] update skipped: no text message", JSON.stringify(body));
    return;
  }

  const chatId = message.chat.id;
  const text = message.text?.trim();

  if (!text) {
    await sendMessage(chatId, NON_TEXT_MESSAGE);
    return;
  }

  await sendMessage(chatId, ACK_MESSAGE);
  await runFindOriginPipeline(text, chatId);
}

export async function handleTelegramUpdateInBackground(body: unknown): Promise<void> {
  runInBackground(
    handleTelegramUpdate(body).catch((error: unknown) => {
      console.error("[telegram] handler error", error);
    }),
  );
}
