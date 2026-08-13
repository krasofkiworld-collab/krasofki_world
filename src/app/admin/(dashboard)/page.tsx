import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingBag, Wallet, PackageX } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { SalesChart } from "@/components/admin/sales-chart";
import { StatCard } from "@/components/admin/stat-card";

export const revalidate = 0;

const WEEKDAY_LABELS = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const STATUS_LABEL: Record<string, string> = {
  pending: "Нове",
  confirmed: "Підтверджено",
  shipped: "Відправлено",
  completed: "Завершено",
  cancelled: "Скасовано",
};

export default async function AdminDashboardPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const [
    { count: pendingCount },
    { data: recentOrders },
    { data: paidToday },
    { data: lowStock },
    { count: staffCount },
    { data: weekOrders },
  ] = await Promise.all([
    supabaseServer.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabaseServer
      .from("orders")
      .select("id, order_number, status, total_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseServer
      .from("orders")
      .select("total_amount")
      .eq("payment_status", "paid")
      .gte("created_at", todayStart.toISOString()),
    supabaseServer
      .from("products")
      .select("id, name, stock_quantity")
      .eq("is_active", true)
      .lte("stock_quantity", 5)
      .order("stock_quantity"),
    supabaseServer.from("staff_chats").select("chat_id", { count: "exact", head: true }),
    supabaseServer
      .from("orders")
      .select("total_amount, created_at")
      .eq("payment_status", "paid")
      .gte("created_at", weekStart.toISOString()),
  ]);

  const todayTotal = (paidToday ?? []).reduce((sum, o) => sum + o.total_amount, 0);

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const dayEnd = new Date(day);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const total = (weekOrders ?? [])
      .filter((o) => {
        const created = new Date(o.created_at);
        return created >= day && created < dayEnd;
      })
      .reduce((sum, o) => sum + o.total_amount, 0);
    return { label: WEEKDAY_LABELS[day.getDay()], total };
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Дашборд</h1>

      {staffCount === 0 && (
        <Card className="border-amber-500/50 bg-amber-500/10 p-4">
          <p className="text-sm">
            Ви ще не підключили сповіщення в Telegram.{" "}
            <Link href="/admin/settings" className="font-medium underline">
              Прив&apos;язати Telegram
            </Link>
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={ShoppingBag} label="Нові замовлення" value={String(pendingCount ?? 0)} />
        <StatCard icon={Wallet} label="Оплачено сьогодні" value={formatMoney(todayTotal)} />
        <StatCard icon={PackageX} label="Товари, що закінчуються" value={String(lowStock?.length ?? 0)} />
      </div>

      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="mb-4 font-medium">Продажі за 7 днів</h2>
        <SalesChart data={chartData} />
      </div>

      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="mb-4 font-medium">Останні замовлення</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Номер</TableHead>
              <TableHead>Сума</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(recentOrders ?? []).map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                    {order.order_number}
                  </Link>
                </TableCell>
                <TableCell>{formatMoney(order.total_amount)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{STATUS_LABEL[order.status] ?? order.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {!recentOrders?.length && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Замовлень ще немає.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
