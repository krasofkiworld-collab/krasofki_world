import { Badge } from "@/components/ui/badge";

export function HeroBanner({ storeName }: { storeName: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-5 text-white">
      <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-10 right-10 size-28 rounded-full bg-white/5" />
      <Badge className="relative bg-white/15 text-white hover:bg-white/15">Sale</Badge>
      <h2 className="relative mt-3 text-2xl font-semibold">{storeName}</h2>
      <p className="relative mt-1 text-sm text-white/70">Нова колекція вже в каталозі — обирай свій стиль</p>
    </div>
  );
}
