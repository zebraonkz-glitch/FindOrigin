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

async function testSearch() {
  const key = process.env.SEARCH_API_KEY ?? process.env.SERPER_API_KEY;
  if (!key) {
    console.log("[search] SKIP: SEARCH_API_KEY не задан");
    return;
  }
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": key },
    body: JSON.stringify({ q: "test news", num: 3 }),
  });
  console.log("[search] Serper", res.status, (await res.text()).slice(0, 200));
}

async function testGoogle() {
  const key = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!key || !cx) {
    console.log("[google] SKIP: GOOGLE keys не заданы");
    return;
  }
  const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=test`;
  const res = await fetch(url);
  console.log("[google]", res.status, (await res.text()).slice(0, 200));
}

async function testOpenAi() {
  const key = process.env.OPENAI_API_KEY ?? process.env.OPENROUTER_API_KEY;
  const base = process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1";
  const model = process.env.OPENAI_MODEL ?? "openai/gpt-4o-mini";
  if (!key) {
    console.log("[openai] SKIP: ключ не задан");
    return;
  }
  const headers = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (base.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "https://find-origin-one.vercel.app";
    headers["X-Title"] = "FindOrigin";
  }
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: 'Reply JSON: {"ok":true}' }],
      response_format: { type: "json_object" },
    }),
  });
  console.log("[openai]", res.status, (await res.text()).slice(0, 300));
}

await testSearch();
await testGoogle();
await testOpenAi();
