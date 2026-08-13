import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

// Owner-only — enforced by middleware.ts (isOwnerOnlyRoute), not re-checked here.

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "manager"]).default("manager"),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabaseServer
    .from("admin_users")
    .select("id, email, role, accepted_at, invited_at")
    .order("invited_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = inviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("admin_users")
    .insert({ email: parsed.data.email.toLowerCase(), role: parsed.data.role })
    .select("id")
    .single();

  if (error) {
    const message = error.code === "23505" ? "Цей email вже в команді" : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ id: data.id });
}
