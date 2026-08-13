import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function AdminNoAccessPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Немає доступу</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Ваш акаунт увійшов, але не має доступу до адмінки. Зверніться до власника магазину, щоб вас
        додали до команди.
      </p>
      <SignOutButton redirectUrl="/admin/sign-in">
        <Button variant="outline">Вийти</Button>
      </SignOutButton>
    </div>
  );
}
