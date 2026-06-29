import { findOrigin } from "@/lib/pipeline/find-origin";
import { formatSourcesResult } from "@/lib/pipeline/format";
import { sendMessage } from "@/lib/telegram/client";
import { pipelineErrorMessage } from "@/types/find-origin";

const PIPELINE_TIMEOUT_MS = 55_000;

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
    await sendMessage(chatId, pipelineErrorMessage(error));
  }
}

async function runPipelineSteps(rawInput: string, chatId: number): Promise<void> {
  const result = await findOrigin(rawInput);

  if (!result.ok) {
    await sendMessage(chatId, result.error);
    return;
  }

  await sendMessage(chatId, formatSourcesResult(result.sources), { parseMode: "HTML" });
}
