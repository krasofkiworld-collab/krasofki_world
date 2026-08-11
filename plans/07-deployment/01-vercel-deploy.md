# Деплой на Vercel

## Кроки

1. `vercel login` (якщо ще не залогінено на цій машині) → `vercel link` у корені репо → створює/лінкує проєкт.
2. Додати всі env-змінні з `.env.local` у Vercel Dashboard (Project → Settings → Environment Variables) для оточень **Production** і **Preview**. Не комітити `.env.local` — воно вже в `.gitignore`.
3. `vercel --prod` (або push у `main`, якщо репо підключене до GitHub і є auto-deploy).
4. Після першого деплою — скопіювати виданий домен (`https://krosofki-world.vercel.app` або кастомний) у `NEXT_PUBLIC_APP_URL`.
5. Прогнати `03-bot/01-botfather-setup.md` → `setWebhook` на прод-домен.
6. BotFather → Menu Button → вставити прод `NEXT_PUBLIC_APP_URL`.

## Кастомний домен (опційно)

Vercel Dashboard → Domains → додати домен, налаштувати DNS (CNAME/A-запис у реєстратора). Після підключення — оновити `NEXT_PUBLIC_APP_URL` і всі місця, де він захардкожений (webhook URL, BotFather).

## Serverless-обмеження, які важливо тримати в голові

- API routes (webhook, orders) — за замовчуванням Node.js runtime, ліміт часу виконання залежить від плану Vercel (Hobby: 10с, Pro: 60с+). Нотифікації (`Promise.allSettled`) не повинні блокувати відповідь клієнту довше кількох секунд.
- Немає постійного стану між викликами — усе через Supabase, ніяких in-memory кешів між запитами (крім `React.cache`/TanStack Query на клієнті).
