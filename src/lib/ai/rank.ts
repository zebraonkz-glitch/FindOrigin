import { z } from "zod";
import { chatCompletionJson } from "@/lib/ai/client";
import type { ExtractedEntities } from "@/types/extracted";
import type { RankedSource, SourceCandidate } from "@/types/search";

const MIN_CONFIDENCE = 40;
const MAX_SOURCES = 3;

const rankedSourceSchema = z.object({
  url: z.string(),
  title: z.string(),
  confidence: z.number(),
  reason: z.string(),
});

const rankResponseSchema = z.object({
  sources: z.array(rankedSourceSchema),
});

function buildPrompt(entities: ExtractedEntities, candidates: SourceCandidate[]): string {
  const claimsText =
    entities.claims.length > 0
      ? entities.claims.map((claim, i) => `${i + 1}. ${claim}`).join("\n")
      : entities.rawText;

  const candidatesText = candidates
    .map(
      (candidate, i) =>
        `${i + 1}. URL: ${candidate.url}\n   Title: ${candidate.title}\n   Snippet: ${candidate.snippet}\n   Type: ${candidate.sourceType}`,
    )
    .join("\n\n");

  return [
    "Оцени, какие источники наиболее вероятно являются первоисточником или подтверждают утверждения.",
    "Сравнивай смысл, а не буквальное совпадение слов.",
    "",
    "Исходный текст:",
    entities.rawText,
    "",
    "Ключевые утверждения:",
    claimsText,
    "",
    "Кандидаты:",
    candidatesText,
    "",
    "Верни JSON формата:",
    '{"sources":[{"url":"...","title":"...","confidence":0-100,"reason":"краткое обоснование"}]}',
    "Включай только источники с confidence >= 40. Максимум 3 источника, отсортированных по убыванию confidence.",
    "Если подходящих источников нет, верни пустой массив sources.",
  ].join("\n");
}

export async function rankSources(
  entities: ExtractedEntities,
  candidates: SourceCandidate[],
): Promise<RankedSource[]> {
  if (candidates.length === 0) {
    return [];
  }

  const rawJson = await chatCompletionJson([
    {
      role: "system",
      content:
        "Ты помощник для проверки информации. Отвечай только валидным JSON без markdown.",
    },
    {
      role: "user",
      content: buildPrompt(entities, candidates),
    },
  ]);

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  const validated = rankResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error("AI response does not match expected schema");
  }

  const candidateUrls = new Set(candidates.map((c) => c.url));

  return validated.data.sources
    .filter(
      (source) =>
        source.confidence >= MIN_CONFIDENCE && candidateUrls.has(source.url),
    )
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_SOURCES);
}
