"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, PackageSearch, Heart } from "lucide-react";
import { useCart, cartCount } from "@/stores/cart";
import { useFavorites } from "@/stores/favorites";
import { cn } from "@/lib/utils";

export function ShopNav() {
  const pathname = usePathname();
  const items = useCart((s) => s.items);
  const count = cartCount(items);
  const favoritesCount = useFavorites((s) => s.productIds.length);

  const tabs = [
    { href: "/", label: "Каталог", icon: Home },
    { href: "/favorites", label: "Улюблене", icon: Heart, badge: favoritesCount },
    { href: "/cart", label: "Кошик", icon: ShoppingCart, badge: count },
    { href: "/orders", label: "Замовлення", icon: PackageSearch },
  ];

  return (
    <nav className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-xs",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("size-5", href === "/favorites" && favoritesCount > 0 && "fill-current")} />
              {label}
              {!!badge && (
                <span className="absolute right-1/4 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
