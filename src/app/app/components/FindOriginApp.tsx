"use client";

import { useCallback, useEffect, useState } from "react";
import { ErrorMessage, ResultsList, type SearchState } from "@/app/app/components/ResultsList";
import { useMainButton, useTelegramWebApp } from "@/app/app/hooks/useTelegramWebApp";
import type { FindOriginResult } from "@/types/find-origin";
import styles from "./FindOriginApp.module.css";

const MIN_LENGTH = 10;
const IS_DEV = process.env.NODE_ENV === "development";

export function FindOriginApp() {
  const { webApp, initData, isTelegram, userName } = useTelegramWebApp();
  const [input, setInput] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });

  const canSubmit =
    input.trim().length >= MIN_LENGTH &&
    state.status !== "loading" &&
    (isTelegram || IS_DEV);

  const handleReset = useCallback(() => {
    setState({ status: "idle" });
    setInput("");
  }, []);

  const handleSearch = useCallback(async () => {
    const trimmed = input.trim();

    if (trimmed.length < MIN_LENGTH) {
      setState({ status: "error", message: `Минимум ${MIN_LENGTH} символов.` });
      webApp?.HapticFeedback.notificationOccurred("error");
      return;
    }

    setState({ status: "loading" });
    webApp?.HapticFeedback.impactOccurred("light");

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed, initData: initData || undefined }),
      });

      const data = (await response.json()) as FindOriginResult;

      if (!response.ok || !data.ok) {
        const message = !data.ok ? data.error : "Ошибка сервера";
        setState({ status: "error", message });
        webApp?.HapticFeedback.notificationOccurred("error");
        return;
      }

      setState({ status: "success", data });
      webApp?.HapticFeedback.notificationOccurred("success");
    } catch {
      setState({ status: "error", message: "Не удалось связаться с сервером." });
      webApp?.HapticFeedback.notificationOccurred("error");
    }
  }, [input, initData, webApp]);

  useMainButton(webApp, "Найти источник", handleSearch, {
    visible: state.status !== "success",
    disabled: !canSubmit,
    loading: state.status === "loading",
  });

  useEffect(() => {
    if (!webApp) {
      return;
    }

    if (state.status === "success") {
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleReset);
    } else {
      webApp.BackButton.hide();
    }

    return () => {
      webApp.BackButton.offClick(handleReset);
    };
  }, [webApp, state.status, handleReset]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>FindOrigin</h1>
        <p className={styles.subtitle}>
          {userName ? `Привет, ${userName}!` : "Найдите источник информации"}
        </p>
      </header>

      {state.status !== "success" && (
        <section className={styles.formSection}>
          <label className={styles.label} htmlFor="findorigin-input">
            Текст или ссылка на Telegram-пост
          </label>
          <textarea
            id="findorigin-input"
            className={styles.textarea}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Вставьте текст новости или ссылку t.me/..."
            rows={6}
            disabled={state.status === "loading"}
          />
          <p className={styles.hint}>
            Минимум {MIN_LENGTH} символов. Можно отправить ссылку на публичный пост.
          </p>

          {!isTelegram && IS_DEV && (
            <p className={styles.devHint}>Режим разработки вне Telegram</p>
          )}

          {!isTelegram && !IS_DEV && (
            <p className={styles.devHint}>Откройте приложение через Telegram-бота.</p>
          )}

          <button
            type="button"
            className={styles.button}
            onClick={handleSearch}
            disabled={!canSubmit}
          >
            {state.status === "loading" ? "Ищем…" : "Найти источник"}
          </button>
        </section>
      )}

      {state.status === "loading" && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Анализируем текст и ищем источники…</p>
        </div>
      )}

      {state.status === "error" && <ErrorMessage message={state.message} />}

      {state.status === "success" && (
        <section className={styles.resultsSection}>
          <h2 className={styles.resultsTitle}>Возможные источники</h2>
          <ResultsList sources={state.data.sources} />
          <button type="button" className={styles.buttonSecondary} onClick={handleReset}>
            Новый поиск
          </button>
        </section>
      )}
    </div>
  );
}
