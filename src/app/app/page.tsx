import Script from "next/script";
import type { Metadata } from "next";
import { FindOriginApp } from "@/app/app/components/FindOriginApp";
import "./tma.css";

export const metadata: Metadata = {
  title: "FindOrigin",
  description: "Поиск источников информации",
};

export default function MiniAppPage() {
  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <FindOriginApp />
    </>
  );
}
