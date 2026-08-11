import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createOrderSchema } from "@/lib/validation/order";
import { verifyInitData, DEV_INIT_DATA_FALLBACK_ENABLED } from "@/lib/telegram/verify-init-data";
import { notifyCustomer, notifyStaff, orderMessages } from "@/lib/telegram/notify";

export async function GET(req: NextRequest) {
  const initData = req.headers.get("x-telegram-init-data") ?? "";
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;

  let telegramUserId: number;
  const verified = verifyInitData(initData, botToken);
  if (verified.ok) {
    telegramUserId = verified.userId;
  } else if (DEV_INIT_DATA_FALLBACK_ENABLED && req.nextUrl.searchParams.get("dev_user_id")) {
    telegramUserId = Number(req.nextUrl.searchParams.get("dev_user_id"));
  } else {
    return NextResponse.json({ error: "unauthorized: " + verified.reason }, { status: 401 });
  }

  const { data: customer } = await supabaseServer
    .from("customers")
    .select("id")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  if (!customer) return NextResponse.json({ orders: [] });

  const { data: orders } = await supabaseServer
    .from("orders")
    .select("id, order_number, status, payment_status, total_amount, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders: orders ?? [] });
}

export async function POST(req: NextRequest) {
  const initData = req.headers.get("x-telegram-init-data") ?? "";
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;

  let telegramUser: { userId: number; username?: string; firstName?: string; lastName?: string };

  const verified = verifyInitData(initData, botToken);
  if (verified.ok) {
    telegramUser = verified;
  } else if (DEV_INIT_DATA_FALLBACK_ENABLED) {
    const devUserId = req.nextUrl.searchParams.get("dev_user_id");
    if (!devUserId) {
      return NextResponse.json({ error: "unauthorized: " + verified.reason }, { status: 401 });
    }
    telegramUser = { userId: Number(devUserId) };
  } else {
    return NextResponse.json({ error: "unauthorized: " + verified.reason }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid payload" }, { status: 400 });
  }
  const input = parsed.data;

  // Never trust client-sent prices/names — re-read from DB.
  const productIds = input.items.map((i) => i.productId);
  const variantIds = input.items.map((i) => i.variantId).filter((id): id is string => !!id);

  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] = await Promise.all([
    supabaseServer.from("products").select("id, name, price, stock_quantity, is_active").in("id", productIds),
    variantIds.length
      ? supabaseServer
          .from("product_variants")
          .select("id, product_id, size, color_name, price_override, stock_quantity, is_active")
          .in("id", variantIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (productsError || !products || variantsError) {
    return NextResponse.json({ error: "failed to load products" }, { status: 500 });
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.is_active) {
      return NextResponse.json({ error: `Товар недоступний` }, { status: 409 });
    }
    if (item.variantId) {
      const variant = variantMap.get(item.variantId);
      if (!variant || variant.product_id !== item.productId || !variant.is_active) {
        return NextResponse.json({ error: `Обраний варіант недоступний` }, { status: 409 });
      }
      if (variant.stock_quantity < item.qty) {
        return NextResponse.json(
          { error: `Недостатньо "${product.name}" (розмір ${variant.size}) на складі` },
          { status: 409 }
        );
      }
    } else if (product.stock_quantity < item.qty) {
      return NextResponse.json({ error: `Недостатньо "${product.name}" на складі` }, { status: 409 });
    }
  }

  function unitPrice(item: (typeof input.items)[number]) {
    const product = productMap.get(item.productId)!;
    const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
    return variant?.price_override ?? product.price;
  }

  const subtotal = input.items.reduce((sum, item) => sum + unitPrice(item) * item.qty, 0);

  const { data: customer, error: customerError } = await supabaseServer
    .from("customers")
    .upsert(
      {
        telegram_user_id: telegramUser.userId,
        username: telegramUser.username ?? null,
        first_name: telegramUser.firstName ?? null,
        last_name: telegramUser.lastName ?? null,
      },
      { onConflict: "telegram_user_id" }
    )
    .select("id")
    .single();

  if (customerError || !customer) {
    return NextResponse.json({ error: "failed to upsert customer" }, { status: 500 });
  }

  const { data: order, error: orderError } = await supabaseServer
    .from("orders")
    .insert({
      order_number: "",
      customer_id: customer.id,
      delivery_method: input.deliveryMethod,
      delivery_address: input.deliveryAddress,
      contact_phone: input.contactPhone,
      customer_note: input.note ?? null,
      subtotal_amount: subtotal,
      delivery_amount: 0,
      total_amount: subtotal,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "failed to create order" }, { status: 500 });
  }

  const orderItems = input.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
    const price = unitPrice(item);
    return {
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      product_name: product.name,
      variant_name: variant ? [variant.size, variant.color_name].filter(Boolean).join(" / ") : null,
      unit_price: price,
      quantity: item.qty,
      line_total: price * item.qty,
    };
  });

  const { error: itemsError } = await supabaseServer.from("order_items").insert(orderItems);
  if (itemsError) {
    return NextResponse.json({ error: "failed to create order items" }, { status: 500 });
  }

  await Promise.allSettled([
    notifyCustomer(order.id, telegramUser.userId, orderMessages.created(order.order_number, subtotal)),
    notifyStaff(order.id, orderMessages.createdForStaff(order.order_number, subtotal, telegramUser.username)),
  ]);

  return NextResponse.json({ orderId: order.id, orderNumber: order.order_number });
}
