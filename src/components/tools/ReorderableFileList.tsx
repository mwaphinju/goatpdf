"use client";

import { useState } from "react";
import type { DragEvent } from "react";
import { ChevronDownIcon, FileIcon, GripIcon, XIcon } from "@/components/icons";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/cn";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary, interpolate } from "@/i18n/dictionary";

export interface ReorderableFileListProps {
  files: File[];
  onChange: (files: File[]) => void;
  label: string;
  /** Defaults to English; every existing call site omits this and is unaffected. */
  locale?: Locale;
}

/** An accessible, reorderable file list — move-up/down buttons plus native drag-and-drop — shared by every tool where the order of multiple uploaded files matters (Merge, JPG to PDF). */
export function ReorderableFileList({ files, onChange, label, locale = DEFAULT_LOCALE }: ReorderableFileListProps) {
  const t = getDictionary(locale);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function moveFile(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    const next = [...files];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    const next = [...files];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onChange(next);
    setDragIndex(null);
  }

  if (files.length === 0) return null;

  return (
    <ol aria-label={label} className="flex flex-col gap-2">
      {files.map((file, index) => (
        <li
          key={`${file.name}-${file.lastModified}-${index}`}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(event: DragEvent<HTMLLIElement>) => event.preventDefault()}
          onDrop={() => handleDrop(index)}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900",
            dragIndex === index && "opacity-50",
          )}
        >
          <GripIcon className="h-4 w-4 shrink-0 cursor-grab text-slate-300 dark:text-slate-600" />
          <span className="w-5 shrink-0 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
            {index + 1}
          </span>
          <FileIcon className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-300">{file.name}</span>
          <span className="shrink-0 text-slate-600 dark:text-slate-400">{formatBytes(file.size)}</span>

          <button
            type="button"
            onClick={() => moveFile(index, -1)}
            disabled={index === 0}
            aria-label={interpolate(t.fileList.moveUp, { fileName: file.name })}
            className="shrink-0 rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 dark:focus-visible:outline-emerald-500"
          >
            <ChevronDownIcon className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => moveFile(index, 1)}
            disabled={index === files.length - 1}
            aria-label={interpolate(t.fileList.moveDown, { fileName: file.name })}
            className="shrink-0 rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 dark:focus-visible:outline-emerald-500"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => removeFile(index)}
            aria-label={interpolate(t.upload.removeFile, { fileName: file.name })}
            className="shrink-0 rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 dark:focus-visible:outline-emerald-500"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ol>
  );
}
