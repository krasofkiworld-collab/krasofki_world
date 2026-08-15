import { TelegramInit } from "@/components/shop/telegram-init";
import { ShopNav } from "@/components/shop/shop-nav";
import { StoreHydrator } from "@/components/shop/store-hydrator";
import { AdaptiveContainer } from "@/components/shop/adaptive-container";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <TelegramInit />
      <StoreHydrator />
      <header
        className="sticky top-0 z-10 border-b bg-background/95 px-4 pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingTop: "calc(var(--tg-content-safe-area-top, 0px) + 0.75rem)" }}
      >
        <h1 className="font-heading text-lg font-semibold tracking-tight">Krosofki World</h1>
      </header>
      <AdaptiveContainer>{children}</AdaptiveContainer>
      <ShopNav />
    </div>
  );
}
