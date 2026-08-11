import { TelegramInit } from "@/components/shop/telegram-init";
import { ShopNav } from "@/components/shop/shop-nav";
import { StoreHydrator } from "@/components/shop/store-hydrator";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <TelegramInit />
      <StoreHydrator />
      <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <h1 className="text-lg font-semibold">Krosofki World</h1>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">{children}</main>
      <ShopNav />
    </div>
  );
}
