import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { identifyCustomer } from "@/lib/telegram/identify-customer";

// Lets the checkout page check "can I even order?" before the customer
// fills in the whole form — a blocked customer never existing as a row
// yet (first-ever visit) is not blocked, same as any new customer.
export async function GET(req: NextRequest) {
  const identity = identifyCustomer(req);
  if (!identity.ok) return NextResponse.json({ error: "unauthorized: " + identity.reason }, { status: 401 });

  const lookupColumn = identity.source === "telegram" ? "telegram_user_id" : "web_client_id";
  const lookupValue = identity.source === "telegram" ? identity.telegramUserId : identity.webClientId;
  const { data: customer } = await supabaseServer
    .from("customers")
    .select("is_blocked")
    .eq(lookupColumn, lookupValue)
    .maybeSingle();

  return NextResponse.json({ blocked: customer?.is_blocked ?? false });
}
