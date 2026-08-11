import { ProductForm } from "@/components/admin/product-form";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{isNew ? "Новий товар" : "Редагувати товар"}</h1>
      <ProductForm productId={isNew ? undefined : id} />
    </div>
  );
}
