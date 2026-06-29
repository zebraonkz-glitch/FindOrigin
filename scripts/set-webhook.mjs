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
  console.error("Укажите URL: node scripts/set-webhook.mjs https://your-app.vercel.app/api/webhook");
  process.exit(1);
}

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
