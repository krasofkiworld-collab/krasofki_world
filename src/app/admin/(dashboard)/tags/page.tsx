"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";

type Tag = { id: string; name: string; slug: string };

export default function AdminTagsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-tags-full"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tags");
      const json = (await res.json()) as { tags: Tag[] };
      return json.tags;
    },
  });

  async function addTag() {
    if (!name.trim() || !slug.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) {
        toast.error("Не вдалося створити тег");
        return;
      }
      setName("");
      setSlug("");
      queryClient.invalidateQueries({ queryKey: ["admin-tags-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tags"] });
    } finally {
      setSubmitting(false);
    }
  }

  async function removeTag(id: string) {
    await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["admin-tags-full"] });
  }

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="text-2xl font-semibold">Теги</h1>
      <p className="text-sm text-muted-foreground">
        Теги (напр. "новинка", "розпродаж") можна призначати товарам у формі редагування та фільтрувати ними каталог.
      </p>

      <div className="flex gap-2">
        <Input placeholder="Назва" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <Button onClick={addTag} disabled={submitting}>
          Додати
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {data?.map((t) => (
          <Badge key={t.id} variant="secondary" className="gap-1 pr-1">
            #{t.name}
            <button onClick={() => removeTag(t.id)} className="rounded-full p-0.5 hover:bg-muted-foreground/20">
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {!data?.length && <p className="text-sm text-muted-foreground">Тегів ще немає.</p>}
      </div>
    </div>
  );
}
