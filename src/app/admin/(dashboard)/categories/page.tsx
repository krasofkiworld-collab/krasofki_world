"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, EyeOff, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Category = { id: string; name: string; slug: string; sort_order: number; is_active: boolean };

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
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
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sort_order: (data?.length ?? 0) + 1 }),
      });
      if (!res.ok) {
        toast.error("Не вдалося створити категорію");
        return;
      }
      setName("");
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

  async function removeCategory(cat: Category) {
    if (!confirm(`Видалити категорію «${cat.name}»?`)) return;
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Не вдалося видалити");
      return;
    }
    toast.success("Категорію видалено");
    queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Категорії</h1>

      <div className="flex max-w-md gap-2">
        <Input placeholder="Назва" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={addCategory} disabled={submitting}>
          Додати
        </Button>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Назва</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Порядок</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                <TableCell>{c.sort_order}</TableCell>
                <TableCell>
                  <Badge variant={c.is_active ? "default" : "secondary"}>
                    {c.is_active ? "Активна" : "Прихована"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" className="size-8" aria-label="Дії з категорією" />}
                    >
                      <MoreVertical className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleActive(c)}>
                        {c.is_active ? <EyeOff /> : <Eye />}
                        {c.is_active ? "Приховати" : "Активувати"}
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => removeCategory(c)}>
                        <Trash2 /> Видалити
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
