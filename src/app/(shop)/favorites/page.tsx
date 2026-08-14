import type { Metadata } from "next";
import { FavoritesView } from "@/components/shop/favorites-view";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function FavoritesPage() {
  return <FavoritesView />;
}
