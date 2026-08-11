# Товари та категорії — CRUD

## Список (`/admin/products`)

`Table` (shadcn) з колонками: зображення, назва, категорія, ціна, залишок, статус (активний/прихований), дії. Фільтри зверху: категорія, `low_stock`, пошук за назвою. Пагінація (25/сторінка).

## Форма створення/редагування (`/admin/products/[id]`, `id = "new"` для створення)

react-hook-form + zod-схема (дзеркалить обмеження БД: `price >= 0`, `stock_quantity >= 0`):

- Назва, slug (автогенерація з назви через `slugify`, редагована вручну)
- Категорія — `Select`
- Опис — `Textarea`
- Ціна / стара ціна (для знижки)
- Кількість на складі
- Зображення — **MVP: поле "URL зображення" (одне чи кілька, через кому)**. Post-MVP: аплоад у Supabase Storage bucket `product-images` (публічний bucket, RLS на `storage.objects` — тільки service role пише, публічний read).
- Активний/прихований — `Switch`

## API

- `GET /api/admin/products?page=&category=&q=`
- `POST /api/admin/products` — створення
- `PATCH /api/admin/products/[id]`
- `DELETE /api/admin/products/[id]` — **soft delete** (`is_active = false`), не фізичне видалення — бо `order_items` посилаються на `product_id` і історія замовлень має лишатись коректною.

## Категорії (`/admin/categories`)

Простіший CRUD: назва, slug, порядок сортування (`position`, drag-to-reorder через `@dnd-kit/sortable` — post-MVP, у MVP просто числове поле).
