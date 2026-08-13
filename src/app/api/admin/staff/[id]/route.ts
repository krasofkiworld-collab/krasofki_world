import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

// Owner-only — enforced by middleware.ts (isOwnerOnlyRoute), not re-checked here.

const updateSchema = z.object({ role: z.enum(["owner", "manager"]) });

async function ownerCount(excludeId?: string) {
  let query = supabaseServer.from("admin_users").select("id", { count: "exact", head: true }).eq("role", "owner");
  if (excludeId) query = query.neq("id", excludeId);
  const { count } = await query;
  return count ?? 0;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  if (parsed.data.role === "manager" && (await ownerCount(id)) === 0) {
    return NextResponse.json({ error: "Має лишитись хоча б один власник" }, { status: 400 });
  }

  const { error } = await supabaseServer.from("admin_users").update({ role: parsed.data.role }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: target } = await supabaseServer.from("admin_users").select("role").eq("id", id).single();
  if (target?.role === "owner" && (await ownerCount(id)) === 0) {
    return NextResponse.json({ error: "Має лишитись хоча б один власник" }, { status: 400 });
  }

  const { error } = await supabaseServer.from("admin_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
