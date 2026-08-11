# Лінкування співробітника (Clerk ⇄ Telegram)

Мета: власник/співробітник логіниться в `/admin` через Clerk, і одноразово прив'язує свій особистий Telegram, щоб отримувати нотифікації про нові замовлення. Дизайн підказаний вже існуючою в проєкті таблицею `staff_chats`/`staff_chat_links` (знайдено при перевірці Supabase-проєкту — гарний токен-based патерн, перенесений у нову схему).

## Крок 1 — адмінка генерує токен

`POST /api/admin/staff-link` (захищено Clerk middleware):

```ts
const { userId } = auth();
const { data } = await supabaseServer
  .from("staff_chat_links")
  .insert({ clerk_user_id: userId })
  .select("token")
  .single();

return NextResponse.json({
  deepLink: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=link_${data!.token}`,
});
```

Адмінка показує QR-код або кнопку-лінк, дійсна 15 хвилин (`expires_at` default в `0001_init_schema.sql`).

## Крок 2 — бот приймає `/start link_<token>`

```ts
async function handleStaffLink(ctx: Context, token: string) {
  const { data: link } = await supabaseServer
    .from("staff_chat_links")
    .select("clerk_user_id, expires_at")
    .eq("token", token)
    .single();

  if (!link || new Date(link.expires_at) < new Date()) {
    return ctx.reply("Посилання недійсне або протерміноване. Згенеруйте нове в адмінці.");
  }

  await supabaseServer.from("staff_chats").upsert({
    chat_id: ctx.chat!.id,
    clerk_user_id: link.clerk_user_id,
    username: ctx.from?.username,
  });
  await supabaseServer.from("staff_chat_links").delete().eq("token", token);

  await ctx.reply("✅ Готово! Тепер ви отримуватимете сповіщення про нові замовлення.");
}
```

## Крок 3 — роль `owner` vs `staff`

Перший залінкований акаунт можна вручну промарк­увати `role = 'owner'` прямо в Supabase Table Editor (або SQL). У MVP різниця між `owner`/`staff` не впливає на логіку — всі рядки `staff_chats` отримують однакові нотифікації; `role` зарезервовано на майбутнє (наприклад, лише `owner` бачить фінансові звіти).

## Відв'язка

`DELETE /api/admin/staff-link?chatId=...` (адмінка) — видаляє рядок `staff_chats`. Або сам користувач у боті командою `/unlink`.
