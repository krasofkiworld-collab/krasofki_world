"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ProductImagesField, type ProductImage } from "./product-images-field";
import { ColorVariantsField, type ColorEntry } from "./color-variants-field";
import { CatalogGridPreview, ProductDetailPreview } from "./product-preview";

const formSchema = z.object({
  name: z.string().min(1, "Вкажіть назву"),
  slug: z.string().min(1, "Вкажіть slug"),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  compare_at_price: z.coerce.number().min(0).optional(),
  category_id: z.string().optional(),
  brand_id: z.string().optional(),
  stock_quantity: z.coerce.number().int().min(0),
  is_active: z.boolean(),
  tag_ids: z.array(z.string()).default([]),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

type Category = { id: string; name: string };
type Brand = { id: string; name: string };
type Tag = { id: string; name: string };

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isNew = !productId;
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [colors, setColors] = useState<ColorEntry[]>([]);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      const json = (await res.json()) as { categories: Category[] };
      return json.categories;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const res = await fetch("/api/admin/brands");
      const json = (await res.json()) as { brands: Brand[] };
      return json.brands;
    },
  });

  const { data: tags } = useQuery({
    queryKey: ["admin-tags"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tags");
      const json = (await res.json()) as { tags: Tag[] };
      return json.tags;
    },
  });

  const form = useForm<FormInput, undefined, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { is_active: true, stock_quantity: 0, price: 0, tag_ids: [] },
  });

  const selectedTagIds = form.watch("tag_ids") ?? [];
  const watched = form.watch();
  const colorsTotalStock = colors.reduce((sum, c) => sum + c.sizes.reduce((s, sz) => s + sz.stock_quantity, 0), 0);

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((p) => {
        form.reset({
          name: p.name,
          slug: p.slug,
          description: p.description ?? "",
          price: p.price,
          compare_at_price: p.compare_at_price ?? undefined,
          category_id: p.category_id ?? undefined,
          brand_id: p.brand_id ?? undefined,
          stock_quantity: p.stock_quantity,
          is_active: p.is_active,
          tag_ids: (p.product_tags ?? []).map((pt: { tag_id: string }) => pt.tag_id),
        });
        setImages((p.images ?? []).map((url: string) => ({ url })));
        setColors(
          (p.product_colors ?? [])
            .sort(
              (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
            )
            .map(
              (c: {
                name: string;
                hex: string | null;
                image_url: string | null;
                product_variants: { size: string | null; stock_quantity: number; sku: string | null }[];
              }) => ({
                name: c.name,
                hex: c.hex ?? "#888888",
                image: c.image_url ? { url: c.image_url } : null,
                sizes: (c.product_variants ?? [])
                  .filter((v) => v.size != null)
                  .map((v) => ({ size: v.size as string, stock_quantity: v.stock_quantity, sku: v.sku ?? "" })),
              })
            )
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function toggleTag(tagId: string) {
    const current = form.getValues("tag_ids") ?? [];
    form.setValue(
      "tag_ids",
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]
    );
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      // Images only ever hit Supabase Storage here, at save time — not the
      // moment a file is picked. Anything without a `file` is already an
      // uploaded URL (edit mode); anything with one is a pending local
      // blob: preview that needs uploading now.
      const pending = images.filter((img) => img.file);
      let uploadedUrls: string[] = [];
      if (pending.length) {
        const form = new FormData();
        pending.forEach((img) => form.append("files", img.file!));
        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.error ?? "Не вдалося завантажити фото");
          return;
        }
        uploadedUrls = (await res.json()).urls as string[];
      }
      let uploadIndex = 0;
      const finalImages = images.map((img) => (img.file ? uploadedUrls[uploadIndex++] : img.url));

      // Same upload-on-save pattern as the product gallery, but per-color.
      const pendingColorImages = colors.filter((c) => c.image?.file);
      let colorUploadedUrls: string[] = [];
      if (pendingColorImages.length) {
        const colorForm = new FormData();
        pendingColorImages.forEach((c) => colorForm.append("files", c.image!.file!));
        const res = await fetch("/api/admin/upload", { method: "POST", body: colorForm });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.error ?? "Не вдалося завантажити фото кольору");
          return;
        }
        colorUploadedUrls = (await res.json()).urls as string[];
      }
      let colorUploadIndex = 0;
      const finalColors = colors.map((c) => ({
        name: c.name,
        hex: c.hex || null,
        image_url: c.image ? (c.image.file ? colorUploadedUrls[colorUploadIndex++] : c.image.url) : null,
        sizes: c.sizes
          .filter((s) => s.size.trim())
          .map((s) => ({ size: s.size.trim(), stock_quantity: s.stock_quantity, sku: s.sku || null })),
      }));

      const payload = {
        ...values,
        images: finalImages,
        compare_at_price: values.compare_at_price || null,
        category_id: values.category_id || null,
        brand_id: values.brand_id || null,
        colors: finalColors,
      };

      const res = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${productId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Помилка збереження");
        return;
      }

      toast.success("Збережено");
      router.push("/admin/products");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const previewData = {
    name: watched.name ?? "",
    price: Number(watched.price) || 0,
    compareAtPrice: watched.compare_at_price ? Number(watched.compare_at_price) : undefined,
    images: images.map((i) => i.url),
    brandName: brands?.find((b) => b.id === watched.brand_id)?.name,
    description: watched.description,
  };

  return (
    <div className="flex flex-wrap items-start gap-8">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full max-w-xl flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Назва</Label>
          <Input id="name" {...form.register("name")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...form.register("slug")} placeholder="air-classic-white" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Категорія</Label>
            <Select
              value={form.watch("category_id")}
              onValueChange={(v) => form.setValue("category_id", v ?? undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Без категорії">
                  {(value: string) => categories?.find((c) => c.id === value)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Бренд</Label>
            <Select value={form.watch("brand_id")} onValueChange={(v) => form.setValue("brand_id", v ?? undefined)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Без бренду">
                  {(value: string) => brands?.find((b) => b.id === value)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {brands?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!!tags?.length && (
          <div className="flex flex-col gap-1.5">
            <Label>Теги</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const active = selectedTagIds.includes(t.id);
                return (
                  <button type="button" key={t.id} onClick={() => toggleTag(t.id)}>
                    <Badge variant={active ? "default" : "secondary"} className={cn(!active && "text-muted-foreground")}>
                      #{t.name}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Опис</Label>
          <Textarea id="description" {...form.register("description")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">Ціна</Label>
            <Input id="price" type="number" step="0.01" {...form.register("price")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compare_at_price">Стара ціна</Label>
            <Input id="compare_at_price" type="number" step="0.01" {...form.register("compare_at_price")} />
          </div>
        </div>

        {colors.length ? (
          <div className="flex flex-col gap-1.5">
            <Label>Кількість на складі</Label>
            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              {colorsTotalStock} — рахується автоматично як сума залишків за кольорами й розмірами нижче
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock_quantity">Кількість на складі (без варіантів)</Label>
            <Input id="stock_quantity" type="number" {...form.register("stock_quantity")} />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>Фото товару</Label>
          <ProductImagesField value={images} onChange={setImages} />
        </div>

        <ColorVariantsField value={colors} onChange={setColors} />

        <div className="flex items-center gap-2">
          <Switch
            checked={form.watch("is_active")}
            onCheckedChange={(v) => form.setValue("is_active", v)}
          />
          <Label>Активний (видимий у каталозі)</Label>
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? "Збереження..." : "Зберегти"}
        </Button>
      </form>

      <div className="sticky top-6 flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Вигляд у каталозі</p>
          <CatalogGridPreview data={previewData} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Вигляд сторінки товару</p>
          <ProductDetailPreview data={previewData} />
        </div>
      </div>
    </div>
  );
}
