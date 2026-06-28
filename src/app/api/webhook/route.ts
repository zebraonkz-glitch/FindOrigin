import { waitUntil } from "@vercel/functions";
import { getTelegramWebhookSecret } from "@/lib/env";
import { runFindOriginPipeline } from "@/lib/pipeline/run";
import { sendMessage } from "@/lib/telegram/client";
import { parseTelegramUpdate } from "@/lib/telegram/parse";

export const runtime = "nodejs";

const ACK_MESSAGE = "Принято. Ищу возможные источники…";
const NON_TEXT_MESSAGE =
  "Отправьте текст или ссылку на Telegram-пост (https://t.me/channel/123).";

function verifyWebhookSecret(request: Request): boolean {
  const secret = getTelegramWebhookSecret();
  if (!secret) {
    return true;
  }
  return request.headers.get("X-Telegram-Bot-Api-Secret-Token") === secret;
}

export async function POST(request: Request) {
  if (!verifyWebhookSecret(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const message = parseTelegramUpdate(body);
  if (!message) {
    return Response.json({ ok: true });
  }

  const chatId = message.chat.id;
  const text = message.text?.trim();

  if (!text) {
    waitUntil(sendMessage(chatId, NON_TEXT_MESSAGE));
    return Response.json({ ok: true });
  }

  waitUntil(
    (async () => {
      try {
        await sendMessage(chatId, ACK_MESSAGE);
        await runFindOriginPipeline(text, chatId);
      } catch (error) {
        console.error("[webhook] background error", error);
      }
    })(),
  );

  return Response.json({ ok: true });
}
