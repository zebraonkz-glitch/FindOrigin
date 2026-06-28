import type { EntityExtractionResult, ExtractedEntities, SearchQueries } from "@/types/extracted";

const URL_PATTERN =
  /https?:\/\/[^\s<>"')\]},]+/gi;

const DATE_PATTERNS = [
  /\b\d{4}-\d{2}-\d{2}\b/g,
  /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g,
  /\b\d{1,2}\s+(?:январ(?:я|ь)|феврал(?:я|ь)|мар(?:та|т)|апрел(?:я|ь)|ма(?:я|й)|июн(?:я|ь)|июл(?:я|ь)|август(?:а|а)|сентябр(?:я|ь)|октябр(?:я|ь)|ноябр(?:я|ь)|декабр(?:я|ь))\s+\d{4}\b/gi,
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/gi,
];

const NUMBER_PATTERN =
  /\b\d[\d\s.,]*(?:%|₽|\$|€|USD|EUR|RUB|тыс\.?|млн\.?|млрд\.?|тысяч|миллион(?:ов|а)?|миллиард(?:ов|а)?)?\b/gi;

const NAME_PATTERN =
  /\b(?:[A-ZА-ЯЁ][a-zа-яё]+(?:\s+[A-ZА-ЯЁ][a-zа-яё]+){0,2})\b/g;

const STOP_WORDS = new Set([
  "The",
  "This",
  "That",
  "These",
  "Those",
  "And",
  "But",
  "For",
  "With",
  "From",
  "Telegram",
  "Channel",
  "Это",
  "Эта",
  "Этот",
  "These",
  "March",
  "January",
  "February",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]);

const SENTENCE_SPLIT_PATTERN = /(?<=[.!?…])\s+|\n+/;

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }

  return result;
}

function extractLinks(text: string): string[] {
  return unique((text.match(URL_PATTERN) ?? []).map((link) => link.replace(/[.,;:!?)]+$/, "")));
}

function extractDates(text: string): string[] {
  const dates: string[] = [];
  for (const pattern of DATE_PATTERNS) {
    dates.push(...(text.match(pattern) ?? []));
  }
  return unique(dates.map((date) => date.trim()));
}

function extractNumbers(text: string): string[] {
  return unique(
    (text.match(NUMBER_PATTERN) ?? [])
      .map((number) => number.trim())
      .filter((number) => /\d/.test(number) && number.length <= 32),
  );
}

function extractNames(text: string): string[] {
  return unique(
    (text.match(NAME_PATTERN) ?? []).filter(
      (name) => name.length >= 3 && !STOP_WORDS.has(name) && !/^\d/.test(name),
    ),
  );
}

function scoreSentence(sentence: string): number {
  let score = sentence.length;
  if (/\d/.test(sentence)) score += 10;
  if (DATE_PATTERNS.some((pattern) => pattern.test(sentence))) score += 15;
  if (NAME_PATTERN.test(sentence)) score += 10;
  if (sentence.includes("?")) score -= 5;
  return score;
}

function extractClaims(text: string): string[] {
  const sentences = text
    .split(SENTENCE_SPLIT_PATTERN)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 20);

  if (sentences.length === 0) {
    return [text.slice(0, 300)];
  }

  return unique(
    sentences
      .sort((a, b) => scoreSentence(b) - scoreSentence(a))
      .slice(0, 5),
  );
}

function buildSearchQueries(entities: ExtractedEntities): SearchQueries {
  const primary = entities.claims[0] ?? entities.rawText.slice(0, 200);

  const contextParts = unique([
    ...entities.names.slice(0, 2),
    ...entities.dates.slice(0, 2),
    ...entities.numbers.slice(0, 2),
  ]);

  const secondary: string[] = [];

  if (contextParts.length > 0) {
    secondary.push(`${primary} ${contextParts.join(" ")}`.trim());
  }

  for (const claim of entities.claims.slice(1, 3)) {
    secondary.push(claim);
  }

  return {
    primary,
    secondary: unique(secondary).slice(0, 3),
  };
}

export function extractEntities(text: string): EntityExtractionResult {
  const entities: ExtractedEntities = {
    rawText: text,
    claims: extractClaims(text),
    dates: extractDates(text),
    numbers: extractNumbers(text),
    names: extractNames(text),
    links: extractLinks(text),
  };

  return {
    entities,
    queries: buildSearchQueries(entities),
  };
}
