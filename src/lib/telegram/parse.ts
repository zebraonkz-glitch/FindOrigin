import { telegramUpdateSchema, type TelegramMessage } from "@/lib/telegram/schema";

export function parseTelegramUpdate(body: unknown): TelegramMessage | null {
  const parsed = telegramUpdateSchema.safeParse(body);
  if (!parsed.success || !parsed.data.message) {
    return null;
  }
  return parsed.data.message;
}
