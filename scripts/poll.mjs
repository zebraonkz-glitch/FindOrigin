import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename) {
  try {
    const content = readFileSync(resolve(process.cwd(), filename), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        continue;
      }
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // optional file
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL ?? "http://localhost:3000/api/webhook";
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN не задан в .env.local");
  process.exit(1);
}

let offset = 0;

async function deleteWebhook() {
  const response = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
    method: "POST",
  });
  const data = await response.json();
  console.log("[poll] deleteWebhook:", data);
}

async function forwardUpdate(update) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (secret) {
    headers["X-Telegram-Bot-Api-Secret-Token"] = secret;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Webhook ${response.status}: ${body}`);
  }
}

async function pollOnce() {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=25`,
  );
  const data = await response.json();

  if (!data.ok) {
    throw new Error(`getUpdates failed: ${JSON.stringify(data)}`);
  }

  for (const update of data.result ?? []) {
    offset = update.update_id + 1;
    console.log("[poll] update", update.update_id);
    await forwardUpdate(update);
  }
}

async function main() {
  console.log("[poll] forwarding to", webhookUrl);
  await deleteWebhook();

  while (true) {
    try {
      await pollOnce();
    } catch (error) {
      console.error("[poll] error", error);
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 3000));
    }
  }
}

void main();
