import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/shop/product-detail";
import { ProductBreadcrumb } from "@/components/shop/product-breadcrumb";
import { getCachedProductBySlug } from "@/lib/catalog-cache";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);
  if (!product) return {};

  const description = product.description ?? `${product.name} — купити з доставкою Новою поштою по Україні.`;
  const image = product.images[0];

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title: product.name,
      description,
      images: image ? [{ url: image }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images,
    brand: product.brands ? { "@type": "Brand", name: product.brands.name } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${slug}`,
      priceCurrency: "UAH",
      price: product.price,
      availability:
        product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductBreadcrumb name={product.name} />
      <ProductDetail product={product} />
    </>
  );
}
