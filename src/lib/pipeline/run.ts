import { extractEntities } from "@/lib/extract/entities";
import { resolveInput } from "@/lib/extract/input";
import { rankSources } from "@/lib/ai/rank";
import { formatSourcesResult } from "@/lib/pipeline/format";
import { searchSources } from "@/lib/search";
import { sendMessage } from "@/lib/telegram/client";

const PIPELINE_TIMEOUT_MS = 55_000;

function userFacingError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("SEARCH_API_KEY") || message.includes("Google Search API не настроен") || message.includes("Не настроен поиск")) {
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

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Превышено время обработки запроса"));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function runFindOriginPipeline(
  rawInput: string,
  chatId: number,
): Promise<void> {
  try {
    await withTimeout(runPipelineSteps(rawInput, chatId), PIPELINE_TIMEOUT_MS);
  } catch (error) {
    console.error("[pipeline] error", error);
    await sendMessage(chatId, userFacingError(error));
  }
}

async function runPipelineSteps(rawInput: string, chatId: number): Promise<void> {
  const resolved = await resolveInput(rawInput);

  if (!resolved.ok) {
    await sendMessage(chatId, resolved.error);
    return;
  }

  const { entities, queries } = extractEntities(resolved.data.text);

  console.log("[pipeline] search", { primary: queries.primary.slice(0, 80) });
  const candidates = await searchSources(queries.primary, queries.secondary);

  if (candidates.length === 0) {
    await sendMessage(chatId, "Не удалось найти надёжные источники.");
    return;
  }

  console.log("[pipeline] rank", { candidates: candidates.length });
  const ranked = await rankSources(entities, candidates);
  await sendMessage(chatId, formatSourcesResult(ranked), { parseMode: "HTML" });
}
