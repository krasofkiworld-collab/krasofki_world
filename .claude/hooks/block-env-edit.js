#!/usr/bin/env node
// PreToolUse hook: blocks Edit/Write/MultiEdit on .env* files.
// krosofki_world's .env.local holds live secrets (Supabase service role,
// Clerk secret, Telegram bot token) — an accidental overwrite here is hard
// to notice until something breaks in prod. .env.example stays editable
// (it's the redacted template, meant to be kept in sync by hand).
const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    process.exit(0); // can't parse — don't block on a hook bug
  }

  const path = input?.tool_input?.file_path ?? "";
  const filename = path.split(/[\\/]/).pop() ?? "";

  if (/^\.env(\.|$)/.test(filename) && filename !== ".env.example") {
    console.error(
      `Blocked: ${filename} holds live secrets. Edit it only when the user explicitly asks for an env-var change; ` +
        "if this is intentional, ask the user to confirm or edit it themselves."
    );
    process.exit(2);
  }

  process.exit(0);
});
