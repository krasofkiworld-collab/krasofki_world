import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Умови використання",
  description: "Умови оформлення замовлень, оплати, доставки та повернення в Krasofki World.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <h1 className="text-xl font-semibold">Умови використання</h1>

      <div>
        <p className="font-medium">Замовлення</p>
        <p className="text-muted-foreground">
          Оформлюючи замовлення, ви підтверджуєте намір придбати обрані товари. Ціни вказані в гривнях
          (UAH) і можуть змінюватися до моменту підтвердження замовлення менеджером.
        </p>
      </div>

      <div>
        <p className="font-medium">Оплата</p>
        <p className="text-muted-foreground">
          Оплата — накладеним платежем при отриманні у відділенні Нової пошти, або передоплатою.
        </p>
      </div>

      <div>
        <p className="font-medium">Доставка</p>
        <p className="text-muted-foreground">
          Доставка здійснюється Новою поштою у відділення, вказане при оформленні замовлення.
        </p>
      </div>

      <div>
        <p className="font-medium">Повернення та обмін</p>
        <p className="text-muted-foreground">
          Товар належної якості можна повернути або обміняти протягом 14 днів згідно із Законом України
          «Про захист прав споживачів», якщо збережено товарний вигляд.
        </p>
      </div>

      <div>
        <p className="font-medium">Контакти</p>
        <p className="text-muted-foreground">З усіх питань щодо замовлення пишіть у Telegram-бот магазину.</p>
      </div>
    </div>
  );
}
