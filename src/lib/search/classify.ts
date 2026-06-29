import type { SourceType } from "@/types/search";

const NEWS_DOMAINS = new Set([
  "bbc.com",
  "bbc.co.uk",
  "reuters.com",
  "apnews.com",
  "nytimes.com",
  "theguardian.com",
  "cnn.com",
  "rbc.ru",
  "kommersant.ru",
  "lenta.ru",
  "tass.ru",
  "interfax.ru",
  "meduza.io",
  "rt.com",
  "forbes.com",
  "bloomberg.com",
]);

const BLOG_DOMAINS = new Set([
  "medium.com",
  "substack.com",
  "habr.com",
  "livejournal.com",
  "wordpress.com",
  "blogspot.com",
]);

const OFFICIAL_TLD_PATTERNS = [/\.gov$/i, /\.gov\.[a-z]{2}$/i, /\.mil$/i];

const RESEARCH_PATTERNS = [
  /arxiv\.org$/i,
  /doi\.org$/i,
  /scholar\.google\./i,
  /researchgate\.net$/i,
  /pubmed\.ncbi\.nlm\.nih\.gov$/i,
  /\.edu$/i,
  /ac\.[a-z]{2}$/i,
];

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function classifyDomain(domain: string): SourceType {
  const lower = domain.toLowerCase();

  if (OFFICIAL_TLD_PATTERNS.some((pattern) => pattern.test(lower))) {
    return "official";
  }

  if (
    lower.includes("kremlin") ||
    lower.includes("government") ||
    lower.endsWith(".gov.ru")
  ) {
    return "official";
  }

  if (RESEARCH_PATTERNS.some((pattern) => pattern.test(lower))) {
    return "research";
  }

  if (NEWS_DOMAINS.has(lower)) {
    return "news";
  }

  if (BLOG_DOMAINS.has(lower) || lower.includes("blog.")) {
    return "blog";
  }

  return "other";
}
