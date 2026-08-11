# RLS-модель

Джерело: `supabase/migrations/0003_rls_policies.sql`.

## Принцип

Два ключі Supabase:
- **anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) — потрапляє в браузер. Може все, що дозволяє RLS.
- **service role key** (`SUPABASE_SERVICE_ROLE_KEY`) — **тільки на сервері** (API routes). Обходить RLS повністю.

## Політики

| Таблиця | anon/authenticated | service role |
|---|---|---|
| `categories` | SELECT де `is_active = true` | повний доступ |
| `products` | SELECT де `is_active = true` | повний доступ |
| `product_variants` | SELECT де `is_active = true` і батьківський товар активний | повний доступ |
| `customers`, `orders`, `order_items`, `payments`, `notifications_log`, `staff_chats`, `staff_chat_links`, `store_settings` | **немає жодної політики → 0 доступу** | повний доступ |

## Наслідки для коду

- `src/lib/supabase/client.ts` (anon) можна безпечно імпортувати в Server Components каталогу — навіть якщо колись з'явиться клієнтський fetch до Supabase напряму, витік персональних даних неможливий: цих таблиць anon просто не бачить.
- Будь-яка мутація (`insert`/`update`/`delete`) на `orders`/`customers`/etc. **мусить** йти через `src/lib/supabase/server.ts` всередині `route.ts`, і `route.ts` сам відповідає за авторизацію (перевірка `initData` для Mini App, перевірка Clerk-сесії для адмінки).

## Перевірка (вже зроблено під час setup)

```bash
curl "https://ogcllgdnxtwmkdwgwksc.supabase.co/rest/v1/products?select=slug,name,price" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
# → повертає seed-товари

curl "https://ogcllgdnxtwmkdwgwksc.supabase.co/rest/v1/orders?select=*" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
# → [] (RLS блокує, немає policy)
```
