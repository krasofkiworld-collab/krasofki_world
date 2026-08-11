# Кошик і чекаут

## Кошик — `src/stores/cart.ts` (zustand)

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartItem = { productId: string; variantId?: string; name: string; price: number; image?: string; qty: number };

export const useCart = create(
  persist<{ items: CartItem[]; add: (i: CartItem) => void; remove: (id: string) => void; setQty: (id: string, qty: number) => void; clear: () => void }>(
    (set) => ({
      items: [],
      add: (item) => set((s) => {
        const existing = s.items.find((i) => i.productId === item.productId && i.variantId === item.variantId);
        if (existing) return { items: s.items.map((i) => i === existing ? { ...i, qty: i.qty + item.qty } : i) };
        return { items: [...s.items, item] };
      }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.productId !== id) })),
      setQty: (id, qty) => set((s) => ({ items: s.items.map((i) => i.productId === id ? { ...i, qty } : i) })),
      clear: () => set({ items: [] }),
    }),
    { name: "krosofki-cart" }
  )
);
```

Локальний, синхронізації між пристроями немає в MVP (Telegram Mini App зазвичай відкривається з одного пристрою).

## Чекаут — форма

`components/shop/CheckoutForm.tsx` (react-hook-form + zod):

- Ім'я/телефон — попередньо заповнюються з `Telegram.WebApp.initDataUnsafe.user` (ім'я) і зберігаються в `customers.phone` після першого замовлення.
- Доставка: radio `nova_poshta_branch | nova_poshta_courier | pickup`.
  - `nova_poshta_branch` → поля "Місто", "№ відділення" (просто текстові поля в MVP; API Нової Пошти для автокомпліту — окрема майбутня інтеграція).
  - `pickup` → показати адресу магазину (з `store_settings`, поле додати за потреби).
- Коментар до замовлення — опційний textarea.

## Валідація (zod, `src/lib/validation/order.ts`)

```ts
export const createOrderSchema = z.object({
  items: z.array(z.object({ productId: z.string().uuid(), variantId: z.string().uuid().optional(), qty: z.number().int().min(1) })).min(1),
  deliveryMethod: z.enum(["nova_poshta_branch", "nova_poshta_courier", "pickup"]),
  deliveryAddress: z.object({ city: z.string().min(1), branch: z.string().optional(), street: z.string().optional() }),
  contactPhone: z.string().regex(/^\+?380\d{9}$/, "Формат: +380XXXXXXXXX"),
  note: z.string().max(500).optional(),
});
```

## Після сабміту

`POST /api/orders` (див. `01-architecture/03-data-flow.md`) → успіх → `useCart().clear()` → `router.push('/orders/' + orderId)`.
