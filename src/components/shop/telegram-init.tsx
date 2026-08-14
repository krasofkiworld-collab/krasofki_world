"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        colorScheme: "light" | "dark";
        themeParams: { bg_color?: string };
        setHeaderColor: (color: string) => void;
        initData: string;
        initDataUnsafe: { user?: { id: number; username?: string; first_name?: string } };
        HapticFeedback?: { impactOccurred: (style: "light" | "medium" | "heavy") => void };
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
      };
    };
  }
}

function initTelegramWebApp() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.ready();
  tg.expand();
  document.documentElement.dataset.theme = tg.colorScheme;
  if (tg.themeParams.bg_color) tg.setHeaderColor(tg.themeParams.bg_color);
}

export function TelegramInit() {
  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js"
      strategy="afterInteractive"
      onLoad={initTelegramWebApp}
    />
  );
}

export function getInitData(): string {
  if (typeof window === "undefined") return "";
  return window.Telegram?.WebApp.initData ?? "";
}

/** True when the app is actually running inside Telegram (has a real initData string). */
export function isInTelegram(): boolean {
  return !!getInitData();
}

export function hapticLight() {
  window.Telegram?.WebApp.HapticFeedback?.impactOccurred("light");
}

/**
 * Shows Telegram's native chrome back button (matching the platform's own
 * back-navigation pattern, per Telegram's Mini App design guidelines) for as
 * long as the calling component is mounted. No-op outside Telegram.
 */
export function useTelegramBackButton(onBack: () => void) {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.BackButton) return;
    tg.BackButton.show();
    tg.BackButton.onClick(onBack);
    return () => {
      tg.BackButton?.offClick(onBack);
      tg.BackButton?.hide();
    };
  }, [onBack]);
}

/**
 * Dev-only helper: when there's no real Telegram initData (plain browser
 * testing), appends a fixed dev_user_id so the API's DEV_INIT_DATA_FALLBACK
 * path (server-side, hard-disabled outside NODE_ENV=development) can be
 * exercised locally. No-op — and never reachable — in production.
 */
export function withDevUserId(url: string): string {
  if (process.env.NODE_ENV !== "development" || getInitData()) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}dev_user_id=999999`;
}
