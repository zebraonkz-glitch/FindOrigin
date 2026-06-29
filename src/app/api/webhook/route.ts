import {
  handleTelegramUpdateInBackground,
  verifyWebhookSecret,
} from "@/lib/telegram/handle-update";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!verifyWebhookSecret(request)) {
    console.warn("[webhook] rejected: invalid secret token");
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  handleTelegramUpdateInBackground(body);
  return Response.json({ ok: true });
}

export async function GET() {
  return Response.json({ ok: true, service: "FindOrigin webhook" });
}
