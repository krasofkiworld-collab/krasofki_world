import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Про нас",
  description: "Krosofki World — інтернет-магазин взуття та аксесуарів з доставкою по Україні.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <h1 className="text-xl font-semibold">Про нас</h1>
      <p className="text-muted-foreground">
        Krosofki World — це магазин кросівок, шльопанців та аксесуарів. Ми зібрали каталог у зручному
        форматі: обирайте колір і розмір, кладіть у кошик і оформлюйте замовлення прямо в застосунку —
        через Telegram або на сайті.
      </p>
      <p className="text-muted-foreground">
        Доставляємо по всій Україні Новою поштою у відділення. Кожне замовлення підтверджує менеджер
        особисто, тож ви завжди знаєте, що воно точно в роботі.
      </p>
      <p className="text-muted-foreground">
        Питання по товару чи замовленню — пишіть у наш Telegram-бот, відповімо якнайшвидше.
      </p>
    </div>
  );
}
