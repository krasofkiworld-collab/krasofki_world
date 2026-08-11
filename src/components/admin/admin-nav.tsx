"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Settings, BadgeCheck, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Замовлення", icon: ShoppingBag },
  { href: "/admin/products", label: "Товари", icon: Package },
  { href: "/admin/categories", label: "Категорії", icon: FolderTree },
  { href: "/admin/brands", label: "Бренди", icon: BadgeCheck },
  { href: "/admin/tags", label: "Теги", icon: Hash },
  { href: "/admin/settings", label: "Налаштування", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-r p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-semibold">Krosofki Admin</span>
        <UserButton />
      </div>
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
