import { CheckoutForm } from "@/components/shop/checkout-form";

export default function CheckoutPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Оформлення замовлення</h2>
      <CheckoutForm />
    </div>
  );
}
