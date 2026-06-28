import { MIN_INPUT_TEXT_LENGTH } from "@/lib/env";
import { normalizeText, isTelegramPostUrl } from "@/lib/extract/normalize";
import { fetchTelegramPostText } from "@/lib/extract/telegram-post";
import type { ExtractedInput } from "@/types/extracted";

export type ResolveInputResult =
  | { ok: true; data: ExtractedInput }
  | { ok: false; error: string };

export async function resolveInput(rawInput: string): Promise<ResolveInputResult> {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return {
      ok: false,
      error: "Сообщение пустое. Отправьте текст или ссылку на Telegram-пост.",
    };
  }

  if (isTelegramPostUrl(trimmed)) {
    const postText = await fetchTelegramPostText(trimmed);

    if (!postText) {
      return {
        ok: false,
        error:
          "Не удалось получить текст поста по ссылке. Перешлите текст сообщения напрямую.",
      };
    }

    if (postText.length < MIN_INPUT_TEXT_LENGTH) {
      return {
        ok: false,
        error: "Текст поста слишком короткий для анализа. Добавьте больше контекста.",
      };
    }

    return {
      ok: true,
      data: {
        kind: "telegram_post_url",
        rawInput: trimmed,
        text: postText,
      },
    };
  }

  const text = normalizeText(trimmed);

  if (text.length < MIN_INPUT_TEXT_LENGTH) {
    return {
      ok: false,
      error: `Текст слишком короткий (минимум ${MIN_INPUT_TEXT_LENGTH} символов).`,
    };
  }

  return {
    ok: true,
    data: {
      kind: "text",
      rawInput: trimmed,
      text,
    },
  };
}
