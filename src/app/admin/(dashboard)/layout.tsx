import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <AdminNav />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
