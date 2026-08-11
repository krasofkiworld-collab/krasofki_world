---
name: api-doc
description: Generate/update API reference docs for krosofki_world's Next.js API routes (src/app/api/**). Use when a route is added or changed, or when asked to document the API.
---

# API documentation generator

Produces `docs/api.md` describing every route under `src/app/api/**`. Keep it in sync — regenerate after adding, removing, or changing a route's request/response shape.

## Workflow

1. `Glob` for `src/app/api/**/route.ts`.
2. For each file, read the exported HTTP method handlers (`GET`/`POST`/`PATCH`/`DELETE`). Extract:
   - Path (derive from the file's directory, converting `[id]` → `:id`)
   - Auth model — check for `auth()` (Clerk, admin-only) vs `verifyInitData` (Telegram Mini App) vs neither (public)
   - Request body shape — read the nearest zod schema it validates against (`src/lib/validation/*`, or an inline schema in the route file)
   - Response shape — read the `NextResponse.json(...)` calls, including error-status branches
3. Group into three sections matching this repo's actual auth boundaries: **Public (Mini App)**, **Admin (Clerk)**, **Telegram webhook**.
4. Write `docs/api.md` with one entry per route:

   ```markdown
   ### POST /api/orders
   **Auth**: Telegram `initData` (header `X-Telegram-Init-Data`)
   **Body**: `CreateOrderInput` (src/lib/validation/order.ts)
   **Responses**: 200 `{ orderId, orderNumber }` · 400 validation · 401 unauthorized · 409 stock conflict
   ```

5. Cross-check against `plans/06-integrations/01-supabase-setup.md` and the `01-architecture/03-data-flow.md` plan doc — don't duplicate their prose, link to them for the "why," keep this file to the "what" (endpoint contract).

## When NOT to touch

Don't document `src/app/api/telegram/webhook` request/response bodies in detail — that's the Telegram Bot API's shape, not this project's; just note the auth (`X-Telegram-Bot-Api-Secret-Token`) and link to `plans/03-bot/02-webhook-architecture.md`.
