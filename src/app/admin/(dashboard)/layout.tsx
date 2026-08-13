import { headers } from "next/headers";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Set by middleware.ts after checking admin_users — trusted here since
  // every request under /admin already passed through it.
  const role = (await headers()).get("x-admin-role") === "owner" ? "owner" : "manager";

  return (
    <div className="flex min-h-svh bg-muted/30">
      <AdminNav role={role} />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
