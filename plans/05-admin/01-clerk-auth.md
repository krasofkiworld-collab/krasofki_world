# Clerk у адмінці

## Middleware

`src/middleware.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isPublicAdminRoute = createRouteMatcher(["/admin/sign-in(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req) && !isPublicAdminRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

Важливо: matcher виключає `app/(shop)/**` і `app/api/telegram/webhook` неявно — вони не під `/admin`, тому Clerk їх не чіпає (Mini App не має бачити жодного Clerk-коду).

## Провайдер

`app/providers.tsx` огортає **весь** застосунок у `<ClerkProvider>` (бібліотека сама не заважає, якщо сесії немає — просто `useAuth()` поверне `null` у Mini App-частині, яка його й не викликає).

## Сторінка логіну

`app/admin/sign-in/[[...rest]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";
export default function Page() {
  return <SignIn path="/admin/sign-in" routing="path" />;
}
```

## Перший адмін-акаунт

Clerk Dashboard → Users → створити вручну (email/password або запросити себе), або дозволити self-signup і потім вручну зняти публічну реєстрацію (`Clerk Dashboard → User & Authentication → Restrictions`), щоб сторонні не могли зареєструватись в адмінку самі.
