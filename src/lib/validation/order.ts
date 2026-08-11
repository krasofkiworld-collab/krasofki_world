import { z } from "zod";

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        qty: z.number().int().min(1).max(50),
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
