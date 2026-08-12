"use client";

import { useRef } from "react";
import { Upload, X } from "lucide-react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_SIZE = 5 * 1024 * 1024;

export type LogoImage = { url: string; file?: File };

/** Single-image picker with local preview — mirrors ProductImagesField's
 * "upload only on save" behavior, just without the multi-image/cover-pick
 * bits a brand logo doesn't need. */
export function LogoUploadField({
  value,
  onChange,
}: {
  value: LogoImage | null;
  onChange: (next: LogoImage | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || file.size > MAX_SIZE) return;
    if (value?.file) URL.revokeObjectURL(value.url);
    onChange({ url: URL.createObjectURL(file), file });
    if (inputRef.current) inputRef.current.value = "";
  }

  function clear() {
    if (value?.file) URL.revokeObjectURL(value.url);
    onChange(null);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed text-muted-foreground hover:border-primary hover:text-primary"
        title="Завантажити лого"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- mix of blob: previews and remote URLs
          <img src={value.url} alt="" className="size-full object-cover" />
        ) : (
          <Upload className="size-4" />
        )}
      </button>
      {value && (
        <button type="button" onClick={clear} className="text-muted-foreground hover:text-destructive" title="Прибрати">
          <X className="size-4" />
        </button>
      )}
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => handleFile(e.target.files)} />
    </div>
  );
}
