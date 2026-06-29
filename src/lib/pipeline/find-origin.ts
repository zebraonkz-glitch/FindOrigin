import { extractEntities } from "@/lib/extract/entities";
import { resolveInput } from "@/lib/extract/input";
import { rankSources } from "@/lib/ai/rank";
import { searchSources } from "@/lib/search";
import type { FindOriginResult } from "@/types/find-origin";

export async function findOrigin(rawInput: string): Promise<FindOriginResult> {
  const resolved = await resolveInput(rawInput);

  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }

  const { entities, queries } = extractEntities(resolved.data.text);
  const candidates = await searchSources(queries.primary, queries.secondary);

  if (candidates.length === 0) {
    return { ok: false, error: "Не удалось найти надёжные источники." };
  }

  const sources = await rankSources(entities, candidates);

  return {
    ok: true,
    analyzedText: resolved.data.text,
    sources,
  };
}
