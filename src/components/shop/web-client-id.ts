"use client";

// Identifies a guest visiting the shop in a plain browser (outside Telegram,
// where there's no initData to verify). A random id is generated once and
// kept in localStorage so their order history stays theirs across visits.
const STORAGE_KEY = "krosofki-web-client-id";

export function getWebClientId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
