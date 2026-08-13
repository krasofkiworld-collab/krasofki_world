"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LogoUploadField, type LogoImage } from "@/components/admin/logo-upload-field";
import { toast } from "sonner";

type Brand = { id: string; name: string; slug: string; logo_url: string | null; sort_order: number; is_active: boolean };

export default function AdminBrandsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState<LogoImage | null>(null);
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
      // Same rule as product photos: nothing hits Supabase Storage until
      // the brand is actually saved.
      let logoUrl: string | null = null;
      if (logo?.file) {
        const form = new FormData();
        form.append("files", logo.file);
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: form });
        if (!uploadRes.ok) {
          const body = await uploadRes.json().catch(() => ({}));
          toast.error(body.error ?? "Не вдалося завантажити лого");
          return;
        }
        logoUrl = (await uploadRes.json()).urls[0];
      }

      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, logo_url: logoUrl, sort_order: (data?.length ?? 0) + 1 }),
      });
      if (!res.ok) {
        toast.error("Не вдалося створити бренд");
        return;
      }
      setName("");
      setSlug("");
      setLogo(null);
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

      <div className="flex max-w-2xl items-center gap-2">
        <LogoUploadField value={logo} onChange={setLogo} />
        <Input placeholder="Назва" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <Button onClick={addBrand} disabled={submitting}>
          Додати
        </Button>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-foreground/10">
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
    </div>
  );
}
