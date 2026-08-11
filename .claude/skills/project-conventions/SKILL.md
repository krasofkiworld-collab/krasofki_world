---
name: project-conventions
description: Non-obvious conventions and past bugs in krosofki_world — read before touching Supabase queries, zustand stores, or Base UI components in this repo
user-invocable: false
---

# krosofki_world — project conventions

Background knowledge for this specific repo. Not a workflow to run — read it when the task touches one of these areas, so past bugs don't get re-introduced.

## Data access model (security-critical)

- Anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is browser-safe and can only ever read the public catalog (`products`, `categories`, `brands`, `tags` where active). Enforced by RLS in `supabase/migrations/0003_rls_policies.sql` + `0005_brands_tags_rls.sql` — every other table has **zero** anon/authenticated policies.
- All writes and all reads of `customers`/`orders`/`payments`/`staff_chats`/etc. go through `src/lib/supabase/server.ts` (service role, `import "server-only"`), called only from `route.ts` files. Never import it into a client component.
- Mini App requests are authenticated by verifying Telegram `initData` (`src/lib/telegram/verify-init-data.ts`), not by a session cookie. Admin requests are authenticated by Clerk (`auth()` from `@clerk/nextjs/server`).

## Supabase/PostgREST gotcha

`.eq("relation.column", value)` on an embedded (non-`!inner`) relation is a **silent no-op** — PostgREST only filters the parent row when the join is `!inner`. Bit us on the brand filter (`src/app/(shop)/page.tsx`): looked correct, returned every product regardless of brand. Pattern used there — build the join clause (`!inner` vs plain) conditionally based on whether that filter is actually active, so unfiltered rows without a category/brand/tag still show up when no filter is applied.

## Base UI (shadcn's base, not Radix)

This project's shadcn init picked **Base UI**, not Radix — `@base-ui/react`. Two differences that produced real bugs:
- `Select.Value` does **not** auto-derive the label from the matching `Select.Item` the way Radix does. Always pass a `children` render function: `<SelectValue>{(value) => labelFor(value)}</SelectValue>` — otherwise it renders the raw value.
- `Button` has no Radix-style `asChild`/`Slot`. Use the `render` prop instead: `<Button render={<Link href="/x">Text</Link>} />`. `nativeButton` defaults to `false` automatically when `render` is passed (patched in `src/components/ui/button.tsx`) — don't hardcode `nativeButton={false}` per call-site, the component handles it.

## zustand + persist + SSR

Any zustand store with `persist` (`src/stores/cart.ts`, `src/stores/favorites.ts`) **must** set `skipHydration: true`, or the very first client render reads localStorage before React reconciles against the server HTML → hydration mismatch (visible as e.g. the favorites heart icon or cart badge flipping state right after load). `StoreHydrator` (`src/components/shop/store-hydrator.tsx`, mounted in `app/(shop)/layout.tsx`) calls `.persist.rehydrate()` post-mount for both stores — new persisted stores need to be added there too.

## Currency formatting

Don't use `Intl.NumberFormat(..., { style: "currency", currency: "UAH" })` — Node's and the browser's bundled ICU data disagree on the UAH symbol ("грн" vs "₴"), which is a real SSR/CSR hydration mismatch, not cosmetic. `src/lib/format.ts`'s `formatMoney` formats the number with Intl and appends a fixed suffix string instead.

## Product images

Uploaded via `POST /api/admin/upload` → Supabase Storage bucket `product-images` (public, 5MB limit, jpeg/png/webp/avif) — **only at form-submit time**, never when a file is picked. `ProductImagesField` (`src/components/admin/product-images-field.tsx`) holds picked files as local `blob:` object URLs until submit; `ProductForm`'s `onSubmit` uploads pending files, then merges the returned public URLs into `images[]` in the same order, with index 0 always the catalog-grid cover.

## Order stock validation

Never trust client-sent price or stock. `POST /api/orders` (`src/app/api/orders/route.ts`) re-reads `products`/`product_variants` server-side before creating `order_items`. Client-side `ProductPurchasePanel` also clamps the qty stepper to the selected variant's `stock_quantity` (recomputed on every size/color change) — that's a UX nicety, not the security boundary; the server check is.

## Supabase CLI on Windows

`supabase db query --linked --file ...` mangled Cyrillic text on this machine (UTF-8 bytes round-tripped through the wrong codepage) even though the source file was correct UTF-8. `supabase db push` (real migration files) does **not** have this problem — always prefer writing a migration + `db push` over `db query --linked` for anything containing non-ASCII text.
