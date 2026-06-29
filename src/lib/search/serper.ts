import { getSearchApiKey } from "@/lib/env";
import { classifyDomain, extractDomain } from "@/lib/search/classify";
import type { SourceCandidate } from "@/types/search";

const SERPER_URL = "https://google.serper.dev/search";
const REQUEST_TIMEOUT_MS = 15_000;
const RESULTS_PER_QUERY = 8;

type SerperOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
};

type SerperResponse = {
  organic?: SerperOrganicResult[];
};

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    if (parsed.pathname.endsWith("/") && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

async function searchQuery(query: string): Promise<SourceCandidate[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(SERPER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": getSearchApiKey(),
      },
      body: JSON.stringify({ q: query, num: RESULTS_PER_QUERY }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Serper search failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as SerperResponse;

    return (data.organic ?? [])
      .filter((item) => item.link && item.title)
      .map((item) => {
        const url = item.link!;
        const domain = extractDomain(url);
        return {
          url,
          title: item.title!,
          snippet: item.snippet ?? "",
          domain,
          sourceType: classifyDomain(domain),
        };
      });
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchSources(
  primaryQuery: string,
  secondaryQueries: string[],
): Promise<SourceCandidate[]> {
  const queries = [primaryQuery, ...secondaryQueries.slice(0, 2)];
  const results = await Promise.all(queries.map((query) => searchQuery(query)));

  const seenUrls = new Set<string>();
  const seenDomains = new Set<string>();
  const candidates: SourceCandidate[] = [];

  for (const batch of results) {
    for (const candidate of batch) {
      const normalizedUrl = normalizeUrl(candidate.url);
      if (seenUrls.has(normalizedUrl)) {
        continue;
      }

      const domainKey = candidate.domain.toLowerCase();
      if (seenDomains.has(domainKey)) {
        continue;
      }

      seenUrls.add(normalizedUrl);
      seenDomains.add(domainKey);
      candidates.push({ ...candidate, url: normalizedUrl });

      if (candidates.length >= 15) {
        return candidates;
      }
    }
  }

  return candidates;
}
