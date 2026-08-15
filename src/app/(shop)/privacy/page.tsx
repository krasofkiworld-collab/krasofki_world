import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Політика конфіденційності",
  description: "Які дані збирає Krasofki World і як вони використовуються.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <h1 className="text-xl font-semibold">Політика конфіденційності</h1>
      <p className="text-muted-foreground">
        Ми збираємо тільки дані, необхідні для оформлення й доставки замовлення: ім&apos;я, прізвище,
        номер телефону, адресу доставки (місто та відділення Нової пошти) і, якщо застосунок відкрито
        через Telegram, ваш Telegram ID та юзернейм.
      </p>
      <p className="text-muted-foreground">
        Ці дані зберігаються в базі даних магазину та використовуються виключно для обробки замовлень і
        зв&apos;язку з вами щодо їхнього статусу. Ми не передаємо ваші дані третім сторонам, окрім служби
        доставки (Нова пошта) — в обсязі, необхідному для відправлення.
      </p>
      <p className="text-muted-foreground">
        Якщо ви хочете дізнатись, які дані про вас збережено, або попросити їх видалити — напишіть у наш
        Telegram-бот.
      </p>
    </div>
  );
}
