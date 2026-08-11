import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabaseServer
    .from("staff_chats")
    .select("chat_id, username, role, created_at")
    .eq("clerk_user_id", userId);

  return NextResponse.json({ links: data ?? [] });
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabaseServer
    .from("staff_chat_links")
    .insert({ clerk_user_id: userId })
    .select("token")
    .single();

  if (error || !data) return NextResponse.json({ error: "failed to create link" }, { status: 500 });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  return NextResponse.json({
    token: data.token,
    deepLink: `https://t.me/${botUsername}?start=link_${data.token}`,
  });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const chatId = req.nextUrl.searchParams.get("chatId");
  if (!chatId) return NextResponse.json({ error: "missing chatId" }, { status: 400 });

  const { error } = await supabaseServer
    .from("staff_chats")
    .delete()
    .eq("chat_id", Number(chatId))
    .eq("clerk_user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
