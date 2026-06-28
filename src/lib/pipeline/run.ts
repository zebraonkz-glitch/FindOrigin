import { extractEntities } from "@/lib/extract/entities";
import { resolveInput } from "@/lib/extract/input";
import { formatExtractionResult } from "@/lib/pipeline/format";
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

  const extraction = extractEntities(resolved.data.text);
  await sendMessage(chatId, formatExtractionResult(extraction));
}
