import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { generateUniqueSlug } from "@/lib/slug";
import { z } from "zod";

const brandSchema = z.object({
  name: z.string().min(1),
  logo_url: z.string().optional().nullable(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabaseServer.from("brands").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brands: data });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = brandSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const slug = await generateUniqueSlug("brands", parsed.data.name);
  const { data, error } = await supabaseServer
    .from("brands")
    .insert({ ...parsed.data, slug })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("catalog:brands", { expire: 0 });
  revalidateTag("catalog:products", { expire: 0 });
  return NextResponse.json({ id: data.id });
}
