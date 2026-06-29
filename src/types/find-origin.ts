import type { RankedSource } from "@/types/search";

export type FindOriginSuccess = {
  ok: true;
  analyzedText: string;
  sources: RankedSource[];
};

export type FindOriginFailure = {
  ok: false;
  error: string;
};

export type FindOriginResult = FindOriginSuccess | FindOriginFailure;

export function pipelineErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("SEARCH_API_KEY") ||
    message.includes("Google Search API не настроен") ||
    message.includes("Не настроен поиск")
  ) {
    return "Поиск не настроен на сервере. Задайте SEARCH_API_KEY (Serper) или GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_ENGINE_ID.";
  }
  if (message.includes("OPENAI") || message.includes("OpenAI") || message.includes("OpenRouter")) {
    return "Ошибка AI-сервиса. Проверьте OPENAI_API_KEY и OPENAI_BASE_URL.";
  }
  if (message.includes("Превышено время")) {
    return "Запрос занял слишком много времени. Попробуйте короче текст.";
  }

  return "Произошла ошибка при обработке запроса. Попробуйте позже.";
}
