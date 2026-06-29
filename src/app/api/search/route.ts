import { z } from "zod";
import { getTelegramBotToken } from "@/lib/env";
import { findOrigin } from "@/lib/pipeline/find-origin";
import { pipelineErrorMessage } from "@/types/find-origin";
import { validateInitData } from "@/lib/telegram/validate-init-data";

export const runtime = "nodejs";
export const maxDuration = 60;

const searchRequestSchema = z.object({
  input: z.string().min(1).max(8000),
  initData: z.string().optional(),
});

function isDevBypassAllowed(initData?: string): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.TMA_DEV_BYPASS === "true" &&
    !initData
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = searchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Некорректный запрос" }, { status: 400 });
  }

  const { input, initData } = parsed.data;

  if (!isDevBypassAllowed(initData)) {
    if (!initData) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const validated = validateInitData(initData, getTelegramBotToken());
    if (!validated) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await findOrigin(input.trim());
    return Response.json(result);
  } catch (error) {
    console.error("[api/search] error", error);
    return Response.json(
      { ok: false, error: pipelineErrorMessage(error) },
      { status: 500 },
    );
  }
}
