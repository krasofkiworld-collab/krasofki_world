"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Settings, BadgeCheck, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { PendingOrdersBadge } from "./pending-orders-badge";

const MAIN_LINKS = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Замовлення", icon: ShoppingBag, badge: PendingOrdersBadge },
];

const CATALOG_LINKS = [
  { href: "/admin/products", label: "Товари", icon: Package },
  { href: "/admin/categories", label: "Категорії", icon: FolderTree },
  { href: "/admin/brands", label: "Бренди", icon: BadgeCheck },
  { href: "/admin/tags", label: "Теги", icon: Hash },
];

const OTHER_LINKS = [{ href: "/admin/settings", label: "Налаштування", icon: Settings }];

function NavSection({
  title,
  links,
  pathname,
}: {
  title: string;
  links: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: React.ComponentType }[];
  pathname: string;
}) {
  return (
    <div>
      <p className="mb-2 px-3 text-xs font-medium tracking-wide text-sidebar-foreground/50 uppercase">{title}</p>
      <div className="flex flex-col gap-0.5">
        {links.map(({ href, label, icon: Icon, badge: Badge }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
              {Badge && <Badge />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar px-4 py-6 text-sidebar-foreground">
      <div className="flex items-center justify-between px-1">
        <Link href="/admin" className="text-base font-semibold">
          Krosofki Admin
        </Link>
        <UserButton />
      </div>

      <nav className="flex flex-1 flex-col gap-6">
        <NavSection title="Загальне" links={MAIN_LINKS} pathname={pathname} />
        <NavSection title="Каталог" links={CATALOG_LINKS} pathname={pathname} />
        <NavSection title="Інше" links={OTHER_LINKS} pathname={pathname} />
      </nav>
    </aside>
  );
}
