import type { Metadata } from "next";
import { OrdersView } from "@/components/shop/orders-view";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function OrdersPage() {
  return <OrdersView />;
}
