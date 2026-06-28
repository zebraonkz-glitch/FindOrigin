import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FindOrigin",
  description: "Telegram-бот для поиска источников информации",
};

export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: 640 }}>
      <h1>FindOrigin</h1>
      <p>Telegram-бот для поиска источников информации.</p>
      <p>
        Webhook: <code>/api/webhook</code>
      </p>
    </main>
  );
}
