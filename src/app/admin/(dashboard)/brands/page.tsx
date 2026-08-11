"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Brand = { id: string; name: string; slug: string; logo_url: string | null; sort_order: number; is_active: boolean };

export default function AdminBrandsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const res = await fetch("/api/admin/brands");
      const json = (await res.json()) as { brands: Brand[] };
      return json.brands;
    },
  });

  async function addBrand() {
    if (!name.trim() || !slug.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, logo_url: logoUrl || null, sort_order: (data?.length ?? 0) + 1 }),
      });
      if (!res.ok) {
        toast.error("Не вдалося створити бренд");
        return;
      }
      setName("");
      setSlug("");
      setLogoUrl("");
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(brand: Brand) {
    await fetch(`/api/admin/brands/${brand.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !brand.is_active }),
    });
    queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Бренди</h1>
      <p className="text-sm text-muted-foreground">
        Бренди (Nike, Adidas тощо) з'являються як фільтр у каталозі Mini App.
      </p>

      <div className="flex max-w-2xl gap-2">
        <Input placeholder="Назва" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <Input placeholder="URL логотипу" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        <Button onClick={addBrand} disabled={submitting}>
          Додати
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Лого</TableHead>
            <TableHead>Назва</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((b) => (
            <TableRow key={b.id} className="cursor-pointer" onClick={() => toggleActive(b)}>
              <TableCell>
                {b.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-entered, arbitrary external domain
                  <img src={b.logo_url} alt={b.name} className="size-8 rounded-full object-cover" />
                )}
              </TableCell>
              <TableCell>{b.name}</TableCell>
              <TableCell className="text-muted-foreground">{b.slug}</TableCell>
              <TableCell>
                <Badge variant={b.is_active ? "default" : "secondary"}>
                  {b.is_active ? "Активний" : "Прихований"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
