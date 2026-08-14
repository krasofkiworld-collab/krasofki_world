"use client";

import { useEffect, useState } from "react";
import { isInTelegram } from "./telegram-init";
import { cn } from "@/lib/utils";

/**
 * Opened inside Telegram, the app always renders in a phone-width webview —
 * `max-w-lg` is correct there. Opened as a regular website (web-guest
 * checkout), the same fixed phone width reads as a mockup floating in an
 * otherwise empty page, so widen the content column once we can confirm
 * we're not in Telegram. Defaults to the phone width during SSR/first
 * paint to avoid a hydration flash for the (much more common) Telegram case.
 */
export function AdaptiveContainer({ children }: { children: React.ReactNode }) {
  const [wide, setWide] = useState(false);
  useEffect(() => setWide(!isInTelegram()), []);

  return <main className={cn("mx-auto w-full flex-1 px-4 py-4", wide ? "max-w-4xl" : "max-w-lg")}>{children}</main>;
}
