"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, ShieldCheck, Ban } from "lucide-react";
import { useCart, cartTotal } from "@/stores/cart";
import { formatMoney } from "@/lib/format";
import { getInitData, withDevUserId, isInTelegram } from "./telegram-init";
import { getWebClientId } from "./web-client-id";
import { toast } from "sonner";

const MANAGER_URL = "https://t.me/Manager_obu";

// Only Nova Poshta branch delivery is offered right now — courier and
// pickup are still valid values on the backend/DB enum, just not exposed here.
const checkoutSchema = z.object({
  city: z.string().min(1, "Вкажіть місто"),
  branch: z.string().min(1, "Вкажіть номер відділення"),
  // Just the 9 digits after the fixed +380 prefix shown in the UI — the
  // full E.164 number is assembled in onSubmit before it hits the API.
  contactPhone: z.string().regex(/^\d{9}$/, "Вкажіть 9 цифр номера"),
  note: z.string().max(500).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  contactTelegram: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const total = cartTotal(items);
  const [submitting, setSubmitting] = useState(false);
  // Belt-and-suspenders: the /api/orders 403 also carries blocked:true in
  // case the status check above was stale (e.g. blocked mid-session).
  const [blockedFromSubmit, setBlockedFromSubmit] = useState(false);
  // Evaluated once on mount (client-only) — this never changes mid-session.
  const [inTelegram] = useState(isInTelegram);

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["customer-status"],
    queryFn: async () => {
      const res = await fetch(withDevUserId("/api/customer/status"), {
        headers: {
          "X-Telegram-Init-Data": getInitData(),
          ...(inTelegram ? {} : { "X-Web-Client-Id": getWebClientId() }),
        },
      });
      if (!res.ok) return { blocked: false };
      return (await res.json()) as { blocked: boolean };
    },
  });

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(
      inTelegram
        ? checkoutSchema
        : checkoutSchema.extend({
            firstName: z.string().min(1, "Вкажіть ім'я"),
            lastName: z.string().min(1, "Вкажіть прізвище"),
          })
    ),
  });

  async function onSubmit(values: CheckoutValues) {
    setSubmitting(true);
    try {
      const res = await fetch(withDevUserId("/api/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": getInitData(),
          ...(inTelegram ? {} : { "X-Web-Client-Id": getWebClientId() }),
        },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
          deliveryMethod: "nova_poshta_branch",
          deliveryAddress: { city: values.city, branch: values.branch },
          contactPhone: `+380${values.contactPhone}`,
          note: values.note,
          ...(inTelegram
            ? {}
            : { firstName: values.firstName, lastName: values.lastName, contactTelegram: values.contactTelegram || undefined }),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.blocked) setBlockedFromSubmit(true);
        else toast.error(body.error ?? "Не вдалося оформити замовлення");
        return;
      }

      const { orderId } = await res.json();
      clear();
      router.push(`/orders/${orderId}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (statusLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  if (status?.blocked || blockedFromSubmit) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <Ban className="size-8 text-destructive" />
        <p className="font-medium">Оформлення замовлень для цього акаунта недоступне</p>
        <p className="text-sm text-muted-foreground">
          Якщо вважаєте, що це помилка — зверніться до менеджера, він допоможе розібратись.
        </p>
        <Button render={<a href={MANAGER_URL} target="_blank" rel="noopener noreferrer" />}>
          Написати менеджеру
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <p className="text-xs font-medium text-muted-foreground">Ваше замовлення</p>
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId ?? ""}`} className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">
              {item.name}
              {item.variantLabel && <span className="text-muted-foreground"> · {item.variantLabel}</span>}
              <span className="text-muted-foreground"> × {item.qty}</span>
            </span>
            <span className="shrink-0 font-medium">{formatMoney(item.price * item.qty)}</span>
          </div>
        ))}
      </div>

      <p className="-mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0" />
        Повернення та обмін протягом 14 днів після отримання.
      </p>

      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <p className="text-xs text-muted-foreground">Ваші контактні дані для замовлення</p>
        {!inTelegram && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">Ім&apos;я</Label>
              <Input id="firstName" {...form.register("firstName")} placeholder="Андрій" />
              {form.formState.errors.firstName && (
                <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Прізвище</Label>
              <Input id="lastName" {...form.register("lastName")} placeholder="Шевченко" />
              {form.formState.errors.lastName && (
                <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactTelegram">Telegram (за бажанням)</Label>
              <Input id="contactTelegram" {...form.register("contactTelegram")} placeholder="@username" />
            </div>
          </>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactPhone">Телефон</Label>
          <div className="flex items-center gap-2 rounded-md border border-input px-3 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
            <span className="text-sm text-muted-foreground">+380</span>
            <input
              id="contactPhone"
              type="tel"
              inputMode="numeric"
              placeholder="XXXXXXXXX"
              className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              {...form.register("contactPhone")}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                e.target.value = digits;
                form.setValue("contactPhone", digits, { shouldValidate: true });
              }}
            />
          </div>
          {form.formState.errors.contactPhone && (
            <p className="text-xs text-destructive">{form.formState.errors.contactPhone.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Спосіб доставки</Label>
        <p className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <Truck className="size-4 shrink-0 text-muted-foreground" />
          <span>
            <b className="font-medium">Нова Пошта</b> — відділення
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Оплата</Label>
        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">Накладений платіж — оплата при отриманні + передоплата</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="city">Місто</Label>
        <Input id="city" {...form.register("city")} placeholder="Київ" />
        {form.formState.errors.city && (
          <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="branch">№ відділення</Label>
        <Input id="branch" {...form.register("branch")} placeholder="Відділення №5" />
        {form.formState.errors.branch && (
          <p className="text-xs text-destructive">{form.formState.errors.branch.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Коментар (опційно)</Label>
        <Textarea id="note" {...form.register("note")} placeholder="Побажання до замовлення" />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <span className="text-muted-foreground">Разом</span>
        <span className="text-lg font-semibold">{formatMoney(total)}</span>
      </div>

      <Button type="submit" size="lg" disabled={submitting || !items.length}>
        {submitting ? "Оформлюємо..." : "Підтвердити замовлення"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Повернення та обмін протягом 14 днів. Деталі — в{" "}
        <Link href="/terms" className="underline">
          умовах використання
        </Link>
        .
      </p>
    </form>
  );
}
