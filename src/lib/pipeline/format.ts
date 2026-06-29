import type { RankedSource } from "@/types/search";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatSourcesResult(sources: RankedSource[]): string {
  if (sources.length === 0) {
    return "Не удалось найти надёжные источники.";
  }

  const lines = sources.map((source, index) => {
    const title = escapeHtml(source.title);
    const reason = escapeHtml(source.reason);
    return `${index + 1}. <a href="${source.url}">${title}</a> — ${source.confidence}%\n   ${reason}`;
  });

  return ["Возможные источники:", "", ...lines].join("\n");
}
