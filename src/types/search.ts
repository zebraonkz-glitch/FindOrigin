export type SourceType = "official" | "news" | "blog" | "research" | "other";

export type SourceCandidate = {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  sourceType: SourceType;
};

export type RankedSource = {
  url: string;
  title: string;
  confidence: number;
  reason: string;
};
