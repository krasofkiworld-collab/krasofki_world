import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Часті питання",
  description: "Відповіді на часті питання про замовлення, оплату, доставку та повернення в Krasofki World.",
  alternates: { canonical: "/faq" },
};

const FAQS = [
  {
    q: "Як оформити замовлення?",
    a: "Додайте товар у кошик, оберіть колір і розмір, натисніть «Оформити замовлення» і заповніть контактні дані та адресу доставки.",
  },
  {
    q: "Як я оплачую замовлення?",
    a: "Накладеним платежем — оплата при отриманні у відділенні Нової пошти.",
  },
  {
    q: "Якою службою доставляєте?",
    a: "Новою поштою, у відділення. Номер відділення та місто вказуєте при оформленні замовлення.",
  },
  {
    q: "Коли підтвердять моє замовлення?",
    a: "Після оформлення з вами зв'яжеться менеджер для підтвердження — статус замовлення завжди видно в розділі «Замовлення».",
  },
  {
    q: "Чи можна повернути або обміняти товар?",
    a: "Так, протягом 14 днів згідно із законодавством України про захист прав споживачів — напишіть нам у Telegram-бот, щоб домовитись про повернення чи обмін.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="flex flex-col gap-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-xl font-semibold">Часті питання</h1>
      <div className="flex flex-col divide-y">
        {FAQS.map((f) => (
          <div key={f.q} className="py-3">
            <p className="text-sm font-medium">{f.q}</p>
            <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
