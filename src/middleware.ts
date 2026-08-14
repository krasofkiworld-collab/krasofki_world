import { NextResponse } from "next/server";
import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isPublicAdminRoute = createRouteMatcher(["/admin/sign-in(.*)", "/admin/sign-up(.*)", "/admin/no-access"]);
// Sensitive to the owner only — API keys, and who else gets admin access.
const isOwnerOnlyRoute = createRouteMatcher([
  "/admin/team(.*)",
  "/api/admin/staff(.*)",
  "/admin/settings(.*)",
  "/api/admin/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isAdminRoute(req) || isPublicAdminRoute(req)) return;

  await auth.protect();
  const { userId } = await auth();
  if (!userId) return; // unreachable after protect(), keeps TS happy

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();

  const staff = email
    ? (
        await supabaseServer
          .from("admin_users")
          .select("id, role, clerk_user_id")
          .eq("email", email)
          .maybeSingle()
      ).data
    : null;

  if (!staff) {
    return NextResponse.redirect(new URL("/admin/no-access", req.url));
  }

  // First successful login for a whitelisted email — link the Clerk account.
  if (!staff.clerk_user_id) {
    await supabaseServer
      .from("admin_users")
      .update({ clerk_user_id: userId, accepted_at: new Date().toISOString() })
      .eq("id", staff.id);
  }

  if (staff.role !== "owner" && isOwnerOnlyRoute(req)) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  const headers = new Headers(req.headers);
  headers.set("x-admin-role", staff.role);
  return NextResponse.next({ request: { headers } });
}, {
  frontendApiProxy: {
    enabled: process.env.NEXT_PUBLIC_CLERK_PROXY_ENABLED === "true",
  },
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
