import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Anon-key client — safe to use both in Server Components (public catalog
// reads) and in browser components. The project doesn't use Supabase Auth
// (admin auth is Clerk, storefront identity is Telegram initData), so a
// plain client is enough — no cookie-based session handling needed.
export function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
