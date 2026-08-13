import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Сторінку не знайдено</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Можливо, товар більше не в наявності або посилання застаріло.
      </p>
      <Button render={<Link href="/">До каталогу</Link>} />
    </div>
  );
}
