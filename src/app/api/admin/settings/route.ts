import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const settingsSchema = z.object({
  store_name: z.string().min(1).optional(),
  free_delivery_threshold: z.number().min(0).optional().nullable(),
  nova_poshta_api_key: z.string().optional().nullable(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabaseServer
    .from("store_settings")
    .select("store_name, currency, free_delivery_threshold, nova_poshta_api_key")
    .eq("id", true)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Never send the raw key back to the browser once it's saved — only a
  // masked hint so the admin can confirm which key is on file.
  const { nova_poshta_api_key, ...rest } = data;
  return NextResponse.json({
    ...rest,
    novaPoshtaKeySet: !!nova_poshta_api_key,
    novaPoshtaKeyHint: nova_poshta_api_key ? `••••${nova_poshta_api_key.slice(-4)}` : null,
  });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  if (!Object.keys(parsed.data).length) return NextResponse.json({ ok: true });

  const { error } = await supabaseServer.from("store_settings").update(parsed.data).eq("id", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
