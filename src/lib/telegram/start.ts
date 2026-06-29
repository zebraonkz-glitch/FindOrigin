import { getMiniAppUrl } from "@/lib/env";
import { sendMessage } from "@/lib/telegram/client";

const START_MESSAGE =
  "FindOrigin помогает найти источник информации по тексту или ссылке на пост.";

export async function sendStartMessage(chatId: number): Promise<void> {
  const miniAppUrl = `${getMiniAppUrl()}/app`;

  await sendMessage(chatId, START_MESSAGE, {
    replyMarkup: {
      inline_keyboard: [
        [{ text: "Открыть приложение", web_app: { url: miniAppUrl } }],
      ],
    },
  });
}
