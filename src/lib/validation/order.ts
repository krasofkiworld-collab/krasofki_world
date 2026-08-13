import { z } from "zod";
import { MAX_QTY_PER_ITEM } from "@/lib/constants";

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        qty: z.number().int().min(1).max(MAX_QTY_PER_ITEM, `Максимум ${MAX_QTY_PER_ITEM} шт. одного товару в одному замовленні`),
      })
    )
    .min(1, "Кошик порожній"),
  deliveryMethod: z.enum(["nova_poshta_branch", "nova_poshta_courier", "pickup"]),
  deliveryAddress: z.object({
    city: z.string().min(1, "Вкажіть місто"),
    branch: z.string().optional(),
    street: z.string().optional(),
  }),
  contactPhone: z.string().regex(/^\+?380\d{9}$/, "Формат: +380XXXXXXXXX"),
  note: z.string().max(500).optional(),
  // Only sent (and required) when the shop is opened outside Telegram —
  // there's no Telegram profile to pull a name from in that case.
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  contactTelegram: z.string().max(64).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const updateOrderSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "completed", "cancelled"]).optional(),
  payment_status: z.enum(["unpaid", "paid", "failed", "refunded"]).optional(),
  admin_note: z.string().max(1000).optional(),
});
