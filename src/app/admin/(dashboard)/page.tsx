import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabaseServer } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { SalesChart } from "@/components/admin/sales-chart";

export const revalidate = 0;

const WEEKDAY_LABELS = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

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

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Нові замовлення</p>
          <p className="text-2xl font-semibold">{pendingCount ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Оплачено сьогодні</p>
          <p className="text-2xl font-semibold">{formatMoney(todayTotal)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Товари, що закінчуються</p>
          <p className="text-2xl font-semibold">{lowStock?.length ?? 0}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-2 font-medium">Продажі за 7 днів</h2>
        <SalesChart data={chartData} />
      </Card>

      <div>
        <h2 className="mb-2 font-medium">Останні замовлення</h2>
        <div className="flex flex-col gap-2">
          {(recentOrders ?? []).map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`}>
              <Card className="flex-row items-center justify-between p-3">
                <span>{order.order_number}</span>
                <div className="flex items-center gap-3">
                  <span>{formatMoney(order.total_amount)}</span>
                  <Badge variant="secondary">{order.status}</Badge>
                </div>
              </Card>
            </Link>
          ))}
          {!recentOrders?.length && <p className="text-sm text-muted-foreground">Замовлень ще немає.</p>}
        </div>
      </div>
    </div>
  );
}
