"use client";

import { useState } from "react";
import type { DragEvent } from "react";
import { ChevronDownIcon, FileIcon, GripIcon, XIcon } from "@/components/icons";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface ReorderableFileListProps {
  files: File[];
  onChange: (files: File[]) => void;
  label: string;
}

/** An accessible, reorderable file list — move-up/down buttons plus native drag-and-drop — shared by every tool where the order of multiple uploaded files matters (Merge, JPG to PDF). */
export function ReorderableFileList({ files, onChange, label }: ReorderableFileListProps) {
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
            "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
            dragIndex === index && "opacity-50",
          )}
        >
          <GripIcon className="h-4 w-4 shrink-0 cursor-grab text-slate-300" />
          <span className="w-5 shrink-0 text-center text-xs font-medium text-slate-500">{index + 1}</span>
          <FileIcon className="h-5 w-5 shrink-0 text-slate-400" />
          <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{file.name}</span>
          <span className="shrink-0 text-slate-500">{formatBytes(file.size)}</span>

          <button
            type="button"
            onClick={() => moveFile(index, -1)}
            disabled={index === 0}
            aria-label={`Move ${file.name} up`}
            className="shrink-0 rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronDownIcon className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => moveFile(index, 1)}
            disabled={index === files.length - 1}
            aria-label={`Move ${file.name} down`}
            className="shrink-0 rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => removeFile(index)}
            aria-label={`Remove ${file.name}`}
            className="shrink-0 rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ol>
  );
}
