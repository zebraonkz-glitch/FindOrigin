"use client";

import { useEffect, useRef, useState } from "react";
import type { TelegramWebApp } from "@/types/telegram-webapp";

type TelegramState = {
  webApp: TelegramWebApp | null;
  initData: string;
  isTelegram: boolean;
  userName: string | null;
};

const EMPTY_STATE: TelegramState = {
  webApp: null,
  initData: "",
  isTelegram: false,
  userName: null,
};

function readTelegramState(): TelegramState {
  if (typeof window === "undefined") {
    return EMPTY_STATE;
  }

  const webApp = window.Telegram?.WebApp ?? null;
  if (!webApp) {
    return EMPTY_STATE;
  }

  const user = webApp.initDataUnsafe.user;
  const userName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || null
    : null;

  return {
    webApp,
    initData: webApp.initData,
    isTelegram: Boolean(webApp.initData),
    userName,
  };
}

export function useTelegramWebApp(): TelegramState {
  const [state] = useState(readTelegramState);

  useEffect(() => {
    state.webApp?.ready();
    state.webApp?.expand();
  }, [state.webApp]);

  return state;
}

export function useMainButton(
  webApp: TelegramWebApp | null,
  text: string,
  onClick: () => void,
  options: { visible: boolean; disabled?: boolean; loading?: boolean },
) {
  const { visible, disabled = false, loading = false } = options;
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (!webApp) {
      return;
    }

    const button = webApp.MainButton;
    const handler = () => onClickRef.current();

    button.setText(text);
    button.onClick(handler);

    if (visible) {
      button.show();
    } else {
      button.hide();
    }

    if (disabled || loading) {
      button.disable();
    } else {
      button.enable();
    }

    if (loading) {
      button.showProgress(false);
    } else {
      button.hideProgress();
    }

    return () => {
      button.offClick(handler);
    };
  }, [webApp, text, visible, disabled, loading]);
}
