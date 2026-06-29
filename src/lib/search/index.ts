import {
  getGoogleSearchApiKey,
  getGoogleSearchEngineId,
  getSearchApiKey,
  hasGoogleSearch,
  hasSerperSearch,
} from "@/lib/env";
import { classifyDomain, extractDomain } from "@/lib/search/classify";
import type { SourceCandidate } from "@/types/search";

const REQUEST_TIMEOUT_MS = 15_000;
const RESULTS_PER_QUERY = 8;

type GoogleSearchItem = {
  title?: string;
  link?: string;
  snippet?: string;
};

type GoogleSearchResponse = {
  items?: GoogleSearchItem[];
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

function mapToCandidates(items: Array<{ title?: string; link?: string; snippet?: string }>): SourceCandidate[] {
  return items
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
}

async function searchGoogleQuery(query: string): Promise<SourceCandidate[]> {
  const apiKey = getGoogleSearchApiKey();
  const engineId = getGoogleSearchEngineId();

  if (!apiKey || !engineId) {
    throw new Error("Google Search API не настроен");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", engineId);
    url.searchParams.set("q", query);
    url.searchParams.set("num", String(Math.min(RESULTS_PER_QUERY, 10)));

    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google search failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as GoogleSearchResponse;
    return mapToCandidates(data.items ?? []);
  } finally {
    clearTimeout(timeout);
  }
}

async function searchSerperQuery(query: string): Promise<SourceCandidate[]> {
  const apiKey = getSearchApiKey();

  if (!apiKey) {
    throw new Error("Serper API не настроен");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q: query, num: RESULTS_PER_QUERY }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Serper search failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as { organic?: GoogleSearchItem[] };
    return mapToCandidates(data.organic ?? []);
  } finally {
    clearTimeout(timeout);
  }
}

async function searchQuery(query: string): Promise<SourceCandidate[]> {
  if (hasSerperSearch()) {
    return searchSerperQuery(query);
  }
  if (hasGoogleSearch()) {
    return searchGoogleQuery(query);
  }
  throw new Error("Не настроен поиск: задайте SEARCH_API_KEY или GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_ENGINE_ID");
}

function dedupeCandidates(batches: SourceCandidate[][]): SourceCandidate[] {
  const seenUrls = new Set<string>();
  const seenDomains = new Set<string>();
  const candidates: SourceCandidate[] = [];

  for (const batch of batches) {
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

      if (candidates.length >= 12) {
        return candidates;
      }
    }
  }

  return candidates;
}

export async function searchSources(
  primaryQuery: string,
  secondaryQueries: string[],
): Promise<SourceCandidate[]> {
  const primary = await searchQuery(primaryQuery);
  const batches: SourceCandidate[][] = [primary];

  if (secondaryQueries.length > 0 && primary.length < 8) {
    const secondary = await searchQuery(secondaryQueries[0]!);
    batches.push(secondary);
  }

  return dedupeCandidates(batches);
}
