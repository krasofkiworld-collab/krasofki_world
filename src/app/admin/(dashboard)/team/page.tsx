"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

type StaffMember = {
  id: string;
  email: string;
  role: "owner" | "manager";
  accepted_at: string | null;
  invited_at: string;
};

const ROLE_LABEL: Record<string, string> = { owner: "Власник", manager: "Менеджер" };

export default function AdminTeamPage() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "manager">("manager");
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const res = await fetch("/api/admin/staff");
      const json = (await res.json()) as { staff: StaffMember[] };
      return json.staff;
    },
  });

  async function invite() {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Не вдалося додати");
        return;
      }
      toast.success("Додано — тепер ця людина може зареєструватись на /admin/sign-up цим email");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(member: StaffMember) {
    if (!confirm(`Прибрати ${member.email} з команди?`)) return;
    const res = await fetch(`/api/admin/staff/${member.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Не вдалося прибрати");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Команда</h1>
      <p className="text-sm text-muted-foreground">
        Додайте email працівника — після цього він зможе зареєструватись на сторінці входу в адмінку
        (<code>/admin/sign-up</code>) саме цим email і одразу отримає доступ.
      </p>

      <div className="flex max-w-xl items-center gap-2">
        <Input placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Select value={role} onValueChange={(v) => v && setRole(v as "owner" | "manager")}>
          <SelectTrigger className="w-40">
            <SelectValue>{(value: string) => ROLE_LABEL[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manager">Менеджер</SelectItem>
            <SelectItem value="owner">Власник</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={invite} disabled={submitting}>
          Додати
        </Button>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.email}</TableCell>
                <TableCell>
                  <Badge variant={m.role === "owner" ? "default" : "secondary"}>{ROLE_LABEL[m.role]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {m.accepted_at ? "Активний" : "Очікує реєстрації"}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => remove(m)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!data?.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Ще нікого не додано.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
