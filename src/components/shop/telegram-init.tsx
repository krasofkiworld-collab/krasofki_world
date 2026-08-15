"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        requestFullscreen?: () => void;
        disableVerticalSwipes?: () => void;
        isVersionAtLeast: (version: string) => boolean;
        colorScheme: "light" | "dark";
        themeParams: { bg_color?: string };
        setHeaderColor: (color: string) => void;
        initData: string;
        initDataUnsafe: { user?: { id: number; username?: string; first_name?: string } };
        HapticFeedback?: { impactOccurred: (style: "light" | "medium" | "heavy") => void };
        // contentSafeAreaInset is the one that matters in fullscreen mode —
        // it's the space Telegram's own floating controls (minimize/close)
        // overlap on top of the page content, distinct from safeAreaInset
        // (the device notch/home-indicator area). Only present on 8.0+.
        contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number };
        safeAreaInset?: { top: number; bottom: number; left: number; right: number };
        onEvent?: (event: string, cb: () => void) => void;
        offEvent?: (event: string, cb: () => void) => void;
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
  // requestFullscreen (Bot API 8.0+) goes further than expand() — it removes
  // the remaining chrome/inset instead of just growing to the normal max
  // height. disableVerticalSwipes (7.7+) stops Telegram's own swipe-down-to-
  // close gesture from firing when the user scrolls to the top of the page
  // and the resulting overscroll bounce reads as "pull to dismiss".
  // Both methods exist on the WebApp object even on old clients but *throw*
  // (WebAppMethodUnsupported) instead of being undefined, so a `?.()` call
  // alone isn't enough — isVersionAtLeast has to gate them first.
  if (tg.isVersionAtLeast("8.0")) tg.requestFullscreen?.();
  if (tg.isVersionAtLeast("7.7")) tg.disableVerticalSwipes?.();
  document.documentElement.dataset.theme = tg.colorScheme;
  if (tg.themeParams.bg_color) tg.setHeaderColor(tg.themeParams.bg_color);

  // In fullscreen mode Telegram overlays its own floating minimize/close
  // controls on top of the page — contentSafeAreaInset.top is how much
  // space they take up, so our own sticky header can pad below them
  // instead of being covered. Insets can change after the fact (e.g. the
  // floating controls appearing/disappearing), so this stays subscribed
  // rather than reading the value once.
  function applySafeArea() {
    const inset = tg?.contentSafeAreaInset;
    document.documentElement.style.setProperty("--tg-content-safe-area-top", `${inset?.top ?? 0}px`);
  }
  applySafeArea();
  tg.onEvent?.("contentSafeAreaChanged", applySafeArea);
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
