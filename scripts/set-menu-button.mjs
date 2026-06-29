import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename) {
  try {
    const content = readFileSync(resolve(process.cwd(), filename), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {}
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const token = process.env.TELEGRAM_BOT_TOKEN;
const miniAppUrl =
  process.argv[2] ??
  process.env.MINI_APP_URL ??
  (process.env.WEBHOOK_URL
    ? process.env.WEBHOOK_URL.replace(/\/api\/webhook\/?$/, "/app")
    : "https://find-origin-one.vercel.app/app");

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN не задан");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    menu_button: {
      type: "web_app",
      text: "FindOrigin",
      web_app: { url: miniAppUrl },
    },
  }),
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));

if (data.ok) {
  console.log("Mini App URL:", miniAppUrl);
}
