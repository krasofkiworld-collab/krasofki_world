"use client";

import { useQuery } from "@tanstack/react-query";

/** Live count of orders awaiting confirmation — shown as a badge on the sidebar's "Замовлення" link. */
export function PendingOrdersBadge() {
  const { data } = useQuery({
    queryKey: ["admin-pending-orders-count"],
    queryFn: async () => {
      const res = await fetch("/api/admin/orders?status=pending&page=0");
      const json = (await res.json()) as { total: number };
      return json.total;
    },
    refetchInterval: 30_000,
  });

  if (!data) return null;

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-medium text-primary-foreground">
      {data}
    </span>
  );
}
