import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/shop/product-detail";
import { getCachedProductBySlug } from "@/lib/catalog-cache";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) notFound();

  return <ProductDetail product={product} />;
}
