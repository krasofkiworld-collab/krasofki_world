"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Category = { id: string; name: string; slug: string; sort_order: number; is_active: boolean };

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-categories-full"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      const json = (await res.json()) as { categories: Category[] };
      return json.categories;
    },
  });

  async function addCategory() {
    if (!name.trim() || !slug.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, sort_order: (data?.length ?? 0) + 1 }),
      });
      if (!res.ok) {
        toast.error("Не вдалося створити категорію");
        return;
      }
      setName("");
      setSlug("");
      queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(cat: Category) {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !cat.is_active }),
    });
    queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Категорії</h1>

      <div className="flex max-w-md gap-2">
        <Input placeholder="Назва" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <Button onClick={addCategory} disabled={submitting}>
          Додати
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Назва</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Порядок</TableHead>
            <TableHead>Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((c) => (
            <TableRow key={c.id} className="cursor-pointer" onClick={() => toggleActive(c)}>
              <TableCell>{c.name}</TableCell>
              <TableCell className="text-muted-foreground">{c.slug}</TableCell>
              <TableCell>{c.sort_order}</TableCell>
              <TableCell>
                <Badge variant={c.is_active ? "default" : "secondary"}>
                  {c.is_active ? "Активна" : "Прихована"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
