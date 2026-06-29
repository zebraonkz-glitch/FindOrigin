import { extractEntities } from "@/lib/extract/entities";
import { resolveInput } from "@/lib/extract/input";
import { rankSources } from "@/lib/ai/rank";
import { formatSourcesResult } from "@/lib/pipeline/format";
import { searchSources } from "@/lib/search/serper";
import { sendMessage } from "@/lib/telegram/client";

const PIPELINE_TIMEOUT_MS = 60_000;

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
    await sendMessage(
      chatId,
      "Произошла ошибка при обработке запроса. Попробуйте позже.",
    );
  }
}

async function runPipelineSteps(rawInput: string, chatId: number): Promise<void> {
  const resolved = await resolveInput(rawInput);

  if (!resolved.ok) {
    await sendMessage(chatId, resolved.error);
    return;
  }

  const { entities, queries } = extractEntities(resolved.data.text);

  const candidates = await searchSources(queries.primary, queries.secondary);

  if (candidates.length === 0) {
    await sendMessage(chatId, "Не удалось найти надёжные источники.");
    return;
  }

  const ranked = await rankSources(entities, candidates);
  await sendMessage(chatId, formatSourcesResult(ranked), { parseMode: "HTML" });
}
