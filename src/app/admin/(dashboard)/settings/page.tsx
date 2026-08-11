"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type StaffLink = { chat_id: number; username: string | null; role: string; created_at: string };

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data } = useQuery({
    queryKey: ["staff-links"],
    queryFn: async () => {
      const res = await fetch("/api/admin/staff-link");
      return (await res.json()) as { links: StaffLink[] };
    },
  });

  async function generateLink() {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/staff-link", { method: "POST" });
      const body = await res.json();
      setDeepLink(body.deepLink);
    } finally {
      setGenerating(false);
    }
  }

  async function unlink(chatId: number) {
    await fetch(`/api/admin/staff-link?chatId=${chatId}`, { method: "DELETE" });
    toast.success("Відв'язано");
    queryClient.invalidateQueries({ queryKey: ["staff-links"] });
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold">Налаштування</h1>

      <div>
        <h2 className="mb-2 font-medium">Сповіщення в Telegram</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Прив&apos;яжіть свій Telegram-акаунт, щоб отримувати сповіщення про нові замовлення.
        </p>

        <div className="flex flex-col gap-2">
          {data?.links.map((link) => (
            <Card key={link.chat_id} className="flex-row items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{link.username ? `@${link.username}` : link.chat_id}</p>
                <Badge variant="secondary" className="mt-1">
                  {link.role}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => unlink(link.chat_id)}>
                Відв&apos;язати
              </Button>
            </Card>
          ))}
        </div>

        <Button className="mt-3" onClick={generateLink} disabled={generating}>
          {generating ? "Генеруємо..." : "Прив'язати Telegram"}
        </Button>

        {deepLink && (
          <Card className="mt-3 p-3">
            <p className="text-sm text-muted-foreground">
              Відкрийте це посилання в Telegram (дійсне 15 хв):
            </p>
            <a href={deepLink} target="_blank" className="break-all text-sm font-medium text-primary underline">
              {deepLink}
            </a>
          </Card>
        )}
      </div>
    </div>
  );
}
