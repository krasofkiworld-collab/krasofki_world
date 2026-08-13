"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type StaffLink = { chat_id: number; username: string | null; role: string; created_at: string };

type Settings = {
  store_name: string;
  currency: string;
  free_delivery_threshold: number | null;
  novaPoshtaKeySet: boolean;
  novaPoshtaKeyHint: string | null;
};

const NP_STEPS = [
  { title: "Увійдіть у бізнес-кабінет Нової пошти", href: "https://new.novaposhta.ua/" },
  { title: "Перейдіть у розділ «Налаштування»" },
  { title: "У пункті «Безпека» натисніть «Створити ключ»" },
  { title: "Перейдіть за посиланням «Отримати API Key» і скопіюйте ключ" },
];

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: staffLinks } = useQuery({
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

  const [npKey, setNpKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      return (await res.json()) as Settings;
    },
  });

  async function saveNovaPoshtaKey() {
    if (!npKey.trim()) return;
    setSavingKey(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nova_poshta_api_key: npKey.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Не вдалося зберегти ключ");
        return;
      }
      toast.success("Ключ Нової пошти збережено");
      setNpKey("");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    } finally {
      setSavingKey(false);
    }
  }

  async function removeNovaPoshtaKey() {
    setSavingKey(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nova_poshta_api_key: null }),
      });
      if (!res.ok) {
        toast.error("Не вдалося прибрати ключ");
        return;
      }
      toast.success("Ключ видалено");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    } finally {
      setSavingKey(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Налаштування</h1>

      <div className="max-w-lg">
        <h2 className="mb-2 font-medium">Сповіщення в Telegram</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Прив&apos;яжіть свій Telegram-акаунт, щоб отримувати сповіщення про нові замовлення.
        </p>

        <div className="flex flex-col gap-2">
          {staffLinks?.links.map((link) => (
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
            <p className="text-sm text-muted-foreground">Відкрийте це посилання в Telegram (дійсне 15 хв):</p>
            <a href={deepLink} target="_blank" className="break-all text-sm font-medium text-primary underline">
              {deepLink}
            </a>
          </Card>
        )}
      </div>

      <Separator />

      <div className="flex max-w-xl flex-col gap-4">
        <div>
          <h2 className="font-medium">Інтеграція з Новою поштою</h2>
          <p className="text-sm text-muted-foreground">
            Ключ потрібен, щоб автоматично шукати відділення, рахувати вартість доставки та
            створювати ТТН прямо із замовлення. Згенерувати його можете тільки ви — у своєму
            бізнес-кабінеті Нової пошти.
          </p>
        </div>

        <ol className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
          {NP_STEPS.map((step, i) => (
            <li key={step.title} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                {i + 1}
              </span>
              {step.href ? (
                <a href={step.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                  {step.title} <ExternalLink className="size-3" />
                </a>
              ) : (
                <span>{step.title}</span>
              )}
            </li>
          ))}
        </ol>

        {!isLoading && (
          <div className="flex flex-col gap-2">
            {settings?.novaPoshtaKeySet && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Збережено ключ {settings.novaPoshtaKeyHint}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder={settings?.novaPoshtaKeySet ? "Новий ключ (щоб замінити)" : "Вставте API-ключ"}
                value={npKey}
                onChange={(e) => setNpKey(e.target.value)}
              />
              <Button onClick={saveNovaPoshtaKey} disabled={savingKey || !npKey.trim()}>
                Зберегти
              </Button>
              {settings?.novaPoshtaKeySet && (
                <Button variant="outline" onClick={removeNovaPoshtaKey} disabled={savingKey}>
                  Прибрати
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ключ зберігається в базі даних і ніколи не показується у відкритому вигляді після
              збереження. Автоматичне створення ЕН з цим ключем поки в розробці — зараз він лише
              зберігається для майбутньої інтеграції.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
