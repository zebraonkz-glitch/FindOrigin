import Link from "next/link";

export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: 640 }}>
      <h1>FindOrigin</h1>
      <p>Telegram-бот для поиска источников информации.</p>
      <ul style={{ marginTop: "1rem", lineHeight: 1.8 }}>
        <li>
          <Link href="/app">Telegram Mini App</Link>
        </li>
        <li>
          Webhook: <code>/api/webhook</code>
        </li>
        <li>
          API: <code>POST /api/search</code>
        </li>
      </ul>
    </main>
  );
}
