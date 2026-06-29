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
const webhookUrl = process.argv[2] ?? process.env.WEBHOOK_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN не задан");
  process.exit(1);
}

if (!webhookUrl) {
  console.error(
    "Укажите URL: node scripts/set-webhook.mjs https://find-origin.vercel.app/api/webhook",
  );
  process.exit(1);
}

if (webhookUrl.includes("-projects.vercel.app")) {
  console.error(
    "Ошибка: это preview-URL Vercel (защищён, Telegram получит 302/404).",
  );
  console.error("Используйте production-домен, например: https://find-origin.vercel.app/api/webhook");
  process.exit(1);
}

async function checkWebhookReachable(url) {
  try {
    const response = await fetch(url, { method: "GET", redirect: "manual" });
    if (response.status >= 300 && response.status < 400) {
      throw new Error(`редирект ${response.status} — URL недоступен для Telegram`);
    }
    if (response.status === 404) {
      throw new Error("404 Not Found — проверьте деплой и путь /api/webhook");
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    console.log("[check] GET", url, "→", response.status);
  } catch (error) {
    console.error("[check] webhook недоступен:", error.message ?? error);
    process.exit(1);
  }
}

await checkWebhookReachable(webhookUrl);

const body = new URLSearchParams({ url: webhookUrl });
if (secret) {
  body.set("secret_token", secret);
}

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  body,
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));

if (data.ok) {
  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  console.log(await info.json());
}
