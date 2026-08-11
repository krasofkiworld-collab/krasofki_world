"use client";

import { useRef } from "react";
import { Star, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductImage = { url: string; file?: File };

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_SIZE = 5 * 1024 * 1024;

export function ProductImagesField({
  value,
  onChange,
}: {
  value: ProductImage[];
  onChange: (next: ProductImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const additions: ProductImage[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_SIZE) continue; // silently skip — bucket would reject it anyway
      additions.push({ url: URL.createObjectURL(file), file });
    }
    onChange([...value, ...additions]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    const item = value[index];
    if (item.file) URL.revokeObjectURL(item.url); // only local blob: URLs need revoking
    onChange(value.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {value.map((img, i) => (
          <div key={img.url} className="group relative size-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- mix of blob: previews and remote URLs */}
            <img src={img.url} alt="" className="size-full object-cover" />

            {i === 0 && (
              <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                Обкладинка
              </span>
            )}

            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => makeCover(i)}
                title="Зробити обкладинкою"
                className={cn("rounded p-0.5 text-white hover:bg-white/20", i === 0 && "pointer-events-none opacity-40")}
              >
                <Star className={cn("size-3.5", i === 0 && "fill-white")} />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                title="Видалити"
                className="rounded p-0.5 text-white hover:bg-white/20"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" />
          Додати фото
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        До 5 МБ на файл (JPEG, PNG, WebP, AVIF). Фото завантажаться в сховище лише після натискання
        &quot;Зберегти&quot;. Перший знімок — обкладинка в каталозі, наведіть на фото і натисніть{" "}
        <Star className="inline size-3" />, щоб змінити.
      </p>
    </div>
  );
}
