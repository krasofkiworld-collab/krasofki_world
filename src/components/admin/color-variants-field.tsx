"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ProductImage } from "./product-images-field";

export type ColorSize = { size: string; stock_quantity: number; sku: string };
export type ColorEntry = { name: string; hex: string; image: ProductImage | null; sizes: ColorSize[] };

const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: "Чорний", hex: "#111111" },
  { name: "Білий", hex: "#FFFFFF" },
  { name: "Сірий", hex: "#9CA3AF" },
  { name: "Графітовий", hex: "#374151" },
  { name: "Бежевий", hex: "#E8DCC8" },
  { name: "Червоний", hex: "#EF4444" },
  { name: "Бордовий", hex: "#7F1D1D" },
  { name: "Рожевий", hex: "#EC4899" },
  { name: "Помаранчевий", hex: "#F97316" },
  { name: "Жовтий", hex: "#EAB308" },
  { name: "Зелений", hex: "#22C55E" },
  { name: "Хакі", hex: "#84793D" },
  { name: "М'ятний", hex: "#6EE7B7" },
  { name: "Синій", hex: "#3B82F6" },
  { name: "Блакитний", hex: "#7DD3FC" },
  { name: "Темно-синій", hex: "#1E3A8A" },
  { name: "Фіолетовий", hex: "#A855F7" },
  { name: "Коричневий", hex: "#92400E" },
  { name: "Золотий", hex: "#CA8A04" },
  { name: "Срібний", hex: "#C0C0C0" },
];

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;

export function ColorVariantsField({
  value,
  onChange,
}: {
  value: ColorEntry[];
  onChange: (next: ColorEntry[]) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#888888");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateColor(index: number, patch: Partial<ColorEntry>) {
    onChange(value.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function addColor(name: string, hex: string) {
    const next = [...value, { name, hex, image: null, sizes: [] }];
    onChange(next);
    setExpanded(next.length - 1);
    setPickerOpen(false);
    setCustomName("");
  }

  function removeColor(index: number) {
    const img = value[index].image;
    if (img?.file) URL.revokeObjectURL(img.url);
    onChange(value.filter((_, i) => i !== index));
    setExpanded((e) => (e === index ? null : e && e > index ? e - 1 : e));
  }

  function handleImagePick(index: number, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || file.size > IMAGE_MAX_SIZE) return;
    const prev = value[index].image;
    if (prev?.file) URL.revokeObjectURL(prev.url);
    updateColor(index, { image: { url: URL.createObjectURL(file), file } });
  }

  function removeImage(index: number) {
    const img = value[index].image;
    if (img?.file) URL.revokeObjectURL(img.url);
    updateColor(index, { image: null });
  }

  function addSize(index: number) {
    updateColor(index, { sizes: [...value[index].sizes, { size: "", stock_quantity: 0, sku: "" }] });
  }

  function updateSize(colorIndex: number, sizeIndex: number, patch: Partial<ColorSize>) {
    const sizes = value[colorIndex].sizes.map((s, i) => (i === sizeIndex ? { ...s, ...patch } : s));
    updateColor(colorIndex, { sizes });
  }

  function removeSize(colorIndex: number, sizeIndex: number) {
    updateColor(colorIndex, { sizes: value[colorIndex].sizes.filter((_, i) => i !== sizeIndex) });
  }

  const active = expanded != null ? value[expanded] : undefined;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <Label>Кольори та розміри</Label>
        <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
          <Plus className="size-3.5" /> Додати колір
        </Button>
      </div>

      {!value.length && (
        <p className="text-xs text-muted-foreground">
          Без кольорів товар продається за загальним залишком вище.
        </p>
      )}

      {!!value.length && (
        <div className="grid grid-cols-5 gap-2">
          {value.map((c, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setExpanded(expanded === i ? null : i)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-center",
                expanded === i ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
              )}
              title={c.name}
            >
              <span
                className={cn(
                  "size-8 rounded-full",
                  expanded === i ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "ring-1 ring-border"
                )}
                style={{ backgroundColor: c.hex }}
              />
              <span className="line-clamp-1 w-full text-[10px] text-muted-foreground">{c.name || "Без назви"}</span>
              {c.sizes.length > 0 && (
                <span className="text-[9px] text-muted-foreground">{c.sizes.length} розм.</span>
              )}
            </button>
          ))}
        </div>
      )}

      {active && expanded != null && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <Input
              value={active.name}
              onChange={(e) => updateColor(expanded, { name: e.target.value })}
              placeholder="Назва кольору"
              className="flex-1"
            />
            <Input
              type="color"
              className="h-9 w-12 p-1"
              value={/^#[0-9a-fA-F]{6}$/.test(active.hex) ? active.hex : "#888888"}
              onChange={(e) => updateColor(expanded, { hex: e.target.value })}
            />
            <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeColor(expanded)}>
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div>
            <Label className="mb-1.5 text-xs">Фото для цього кольору</Label>
            {active.image ? (
              <div className="group relative size-20 overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- mix of blob: previews and remote URLs */}
                <img src={active.image.url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(expanded)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-[10px] text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Plus className="size-4" />
                Фото
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => {
                handleImagePick(expanded, e.target.files);
                e.target.value = "";
              }}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Якщо не завантажити — у каталозі показуватиметься перше фото товару.
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="text-xs">Розміри</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => addSize(expanded)}>
                <Plus className="size-3.5" /> Розмір
              </Button>
            </div>
            {!active.sizes.length && <p className="text-xs text-muted-foreground">Розміри не додані.</p>}
            <div className="flex flex-col gap-2">
              {active.sizes.map((s, si) => (
                <div key={si} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px]">Розмір</Label>
                    <Input value={s.size} onChange={(e) => updateSize(expanded, si, { size: e.target.value })} placeholder="42" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px]">Залишок</Label>
                    <Input
                      type="number"
                      value={s.stock_quantity}
                      onChange={(e) => updateSize(expanded, si, { stock_quantity: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeSize(expanded, si)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Додати колір</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((p) => (
              <button
                type="button"
                key={p.hex}
                onClick={() => addColor(p.name, p.hex)}
                title={p.name}
                className="flex flex-col items-center gap-1 rounded-lg p-1.5 text-center hover:bg-muted"
              >
                <span className="size-8 rounded-full ring-1 ring-border" style={{ backgroundColor: p.hex }} />
                <span className="line-clamp-1 w-full text-[9px] text-muted-foreground">{p.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2 border-t pt-3">
            <div className="flex flex-1 flex-col gap-1">
              <Label className="text-xs">Своя назва</Label>
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Наприклад, Оливковий" />
            </div>
            <Input type="color" className="h-9 w-12 p-1" value={customHex} onChange={(e) => setCustomHex(e.target.value)} />
            <Button
              type="button"
              size="icon"
              disabled={!customName.trim()}
              onClick={() => addColor(customName.trim(), customHex)}
            >
              <Check className="size-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
