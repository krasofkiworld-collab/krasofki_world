import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createOrderSchema } from "@/lib/validation/order";
import { identifyCustomer } from "@/lib/telegram/identify-customer";
import { notifyCustomer, notifyStaff, orderMessages } from "@/lib/telegram/notify";
import { adjustStock } from "@/lib/stock";

export async function GET(req: NextRequest) {
  const identity = identifyCustomer(req);
  if (!identity.ok) return NextResponse.json({ error: "unauthorized: " + identity.reason }, { status: 401 });

  const lookupColumn = identity.source === "telegram" ? "telegram_user_id" : "web_client_id";
  const lookupValue = identity.source === "telegram" ? identity.telegramUserId : identity.webClientId;
  const { data: customer } = await supabaseServer.from("customers").select("id").eq(lookupColumn, lookupValue).maybeSingle();

  if (!customer) return NextResponse.json({ orders: [] });

  const { data: orders } = await supabaseServer
    .from("orders")
    .select("id, order_number, status, payment_status, total_amount, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders: orders ?? [] });
}

export async function POST(req: NextRequest) {
  const identity = identifyCustomer(req);
  if (!identity.ok) return NextResponse.json({ error: "unauthorized: " + identity.reason }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid payload" }, { status: 400 });
  }
  const input = parsed.data;

  if (identity.source === "web" && (!input.firstName || !input.lastName)) {
    return NextResponse.json({ error: "Вкажіть ім'я та прізвище" }, { status: 400 });
  }

  // Never trust client-sent prices/names — re-read from DB.
  const productIds = input.items.map((i) => i.productId);
  const variantIds = input.items.map((i) => i.variantId).filter((id): id is string => !!id);

  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] = await Promise.all([
    supabaseServer.from("products").select("id, name, price, stock_quantity, is_active").in("id", productIds),
    variantIds.length
      ? supabaseServer
          .from("product_variants")
          .select("id, product_id, size, price_override, stock_quantity, is_active, product_colors(name)")
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

  const { data: customer, error: customerError } =
    identity.source === "telegram"
      ? await supabaseServer
          .from("customers")
          .upsert(
            {
              telegram_user_id: identity.telegramUserId,
              username: identity.username ?? null,
              first_name: identity.firstName ?? null,
              last_name: identity.lastName ?? null,
              source: "telegram",
            },
            { onConflict: "telegram_user_id" }
          )
          .select("id")
          .single()
      : await supabaseServer
          .from("customers")
          .upsert(
            {
              web_client_id: identity.webClientId,
              first_name: input.firstName,
              last_name: input.lastName,
              phone: input.contactPhone,
              contact_telegram: input.contactTelegram || null,
              source: "web",
            },
            { onConflict: "web_client_id" }
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
      source: identity.source,
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
      variant_name: variant ? [variant.size, variant.product_colors?.name].filter(Boolean).join(" / ") : null,
      unit_price: price,
      quantity: item.qty,
      line_total: price * item.qty,
    };
  });

  const { error: itemsError } = await supabaseServer.from("order_items").insert(orderItems);
  if (itemsError) {
    return NextResponse.json({ error: "failed to create order items" }, { status: 500 });
  }

  // Stock was only validated above, never reserved — deduct it now that the
  // order actually exists, so a second buyer sees the real remaining count.
  await adjustStock(
    input.items.map((item) => ({ productId: item.productId, variantId: item.variantId, qty: item.qty })),
    -1
  );

  // Web guests have no Telegram chat to message — only staff gets pinged for those.
  await Promise.allSettled([
    identity.source === "telegram"
      ? notifyCustomer(order.id, identity.telegramUserId, orderMessages.created(order.order_number, subtotal))
      : Promise.resolve(),
    notifyStaff(
      order.id,
      orderMessages.createdForStaff(order.order_number, subtotal, identity.source === "telegram" ? identity.username : undefined)
    ),
  ]);

  return NextResponse.json({ orderId: order.id, orderNumber: order.order_number });
}
