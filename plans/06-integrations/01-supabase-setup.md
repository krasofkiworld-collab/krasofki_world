# Supabase — налаштування клієнтів

## `src/lib/supabase/client.ts` (browser, anon)

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## `src/lib/supabase/server.ts` (server-only, service role)

```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
```

`import "server-only"` — якщо цей файл випадково імпортується в клієнтський компонент, збірка Next.js впаде з чіткою помилкою замість того, щоб мовчки злити service role key в бандл браузера.

## Типи БД

`npx supabase gen types typescript --project-id ogcllgdnxtwmkdwgwksc > src/lib/supabase/database.types.ts` — перегенерувати після кожної нової міграції. Обидва клієнти типізуються `createClient<Database>(...)`.

## Проєкт вже прив'язаний

```bash
npx supabase link --project-ref ogcllgdnxtwmkdwgwksc   # вже виконано
npx supabase db push                                    # застосувати нові міграції
npx supabase migration list                              # перевірити стан
```
