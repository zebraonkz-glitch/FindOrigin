const TELEGRAM_POST_URL_PATTERN =
  /^https?:\/\/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/(\d+)\/?(?:\?.*)?$/;

export function isTelegramPostUrl(input: string): boolean {
  return TELEGRAM_POST_URL_PATTERN.test(input.trim());
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function isPlainTextInput(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) {
    return false;
  }
  return !isTelegramPostUrl(trimmed);
}
