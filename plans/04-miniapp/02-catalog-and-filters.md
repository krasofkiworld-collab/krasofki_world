# Каталог і фільтри

## Модель запиту

`app/(shop)/page.tsx` — Server Component, читає `?category=&sort=&q=` з `searchParams`:

```ts
let query = supabaseAnon
  .from("products")
  .select("id, slug, name, price, compare_at_price, images, stock_quantity, category_id")
  .eq("is_active", true);

if (category) query = query.eq("category_id", category);
if (q) query = query.ilike("name", `%${q}%`);
query = query.order(sort === "price_asc" ? "price" : "created_at", { ascending: sort === "price_asc" });
```

## Фільтри для масштабування (те, що просив користувач: "щоб все масштабувалось, з фільтрами і всім іншим")

- **Категорії** — чіпи зверху, горизонтальний скрол (`ScrollArea` з shadcn), активна підсвічена.
- **Ціна** — діапазон (два `Input type=number` або slider), застосовується через query params (`?price_min=&price_max=`).
- **Сортування** — `select`: за замовчуванням / дешевші спочатку / дорожчі спочатку / нові.
- **Пошук** — `Input` з debounce 300ms, оновлює `?q=` через `useRouter().push` (`{ scroll: false }`).
- **Наявність** — товари з `stock_quantity = 0` показуються останніми, з бейджем "Немає в наявності", кнопка "Додати в кошик" вимкнена.

## Масштабованість

- Пагінація через `.range(offset, offset + 23)` (24 товари/сторінка) — важливо, коли каталог виросте за сотні позицій. Infinite scroll на клієнті через TanStack Query `useInfiniteQuery`, а не завантаження всього одразу.
- Індекси вже створені (`idx_products_category_id`, `idx_products_is_active`) — фільтр за категорією і активністю не робить full scan навіть за тисяч товарів.
- Для пошуку понад ~5к товарів — розглянути `pg_trgm` індекс на `products.name` (`create index ... using gin (name gin_trgm_ops)`), поки не потрібно.

## Картка товару

`components/shop/ProductCard.tsx`: зображення (перше з `images[]`), назва, ціна (+ закреслена `compare_at_price`, якщо є знижка), кнопка "+" що додає 1 шт у кошик без переходу на сторінку товару (оптимістичний UI + haptic feedback).
