import type { Metadata } from "next";
import { OrderDetailView } from "@/components/shop/order-detail-view";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailView id={id} />;
}
