import type { EntityExtractionResult } from "@/types/extracted";

function formatList(items: string[], emptyLabel: string): string {
  if (items.length === 0) {
    return emptyLabel;
  }
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

export function formatExtractionResult(result: EntityExtractionResult): string {
  const { entities, queries } = result;

  return [
    "Анализ текста завершён.",
    "",
    "Ключевые утверждения:",
    formatList(entities.claims, "— не выделены"),
    "",
    `Даты: ${entities.dates.length > 0 ? entities.dates.join(", ") : "—"}`,
    `Числа: ${entities.numbers.length > 0 ? entities.numbers.join(", ") : "—"}`,
    `Имена: ${entities.names.length > 0 ? entities.names.join(", ") : "—"}`,
    `Ссылки: ${entities.links.length > 0 ? entities.links.join(", ") : "—"}`,
    "",
    "Поисковые запросы (для следующего этапа):",
    `• основной: ${queries.primary}`,
    ...(queries.secondary.length > 0
      ? queries.secondary.map((query) => `• дополнительный: ${query}`)
      : []),
  ].join("\n");
}
