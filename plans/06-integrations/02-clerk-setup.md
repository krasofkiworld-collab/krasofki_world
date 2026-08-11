# Clerk — налаштування

Ключі вже в `.env.local` (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`), інстанс: `musical-caiman-39.clerk.accounts.dev` (dev-режим).

## Що потрібно зробити в Clerk Dashboard

1. **Restrictions** → вимкнути публічну самореєстрацію (тільки адмін запрошує співробітників вручну) — інакше будь-хто зможе зареєструватись і зайти в `/admin`.
2. **Paths** → якщо потрібно, налаштувати `sign-in`/`after-sign-in` URL (вже задано через env: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/admin/sign-in`).
3. **Production instance** — перед реальним запуском створити окремий Production-інстанс Clerk (dev-ключі `pk_test_.../sk_test_...` не для прод-трафіку), додати кастомний домен якщо потрібен.

## Провайдер у застосунку

```tsx
// app/providers.tsx
import { ClerkProvider } from "@clerk/nextjs";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
```

## Доступ до `userId` на сервері

```ts
import { auth } from "@clerk/nextjs/server";
const { userId } = await auth();
```

Використовується в `POST /api/admin/staff-link` для прив'язки `clerk_user_id` до токена лінкування Telegram.
