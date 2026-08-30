"use client";

import { useId, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent } from "react";
import { FileIcon, UploadIcon, XIcon } from "@/components/icons";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface UploadZoneProps {
  accept: string;
  multiple?: boolean;
  maxSizeMB?: number;
  files: File[];
  onFilesChange: (files: File[]) => void;
  label?: string;
  hint?: string;
}

function extensionsFromAccept(accept: string): string[] {
  if (accept.includes("pdf")) return [".pdf"];
  if (accept.includes("jpeg") || accept.includes("jpg")) return [".jpg", ".jpeg"];
  return [];
}

export function UploadZone({
  accept,
  multiple = false,
  maxSizeMB = 50,
  files,
  onFilesChange,
  label = "Drag and drop your file here",
  hint,
}: UploadZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptedExtensions = extensionsFromAccept(accept);

  function validate(candidates: File[]): File[] {
    const valid: File[] = [];
    for (const file of candidates) {
      const lowerName = file.name.toLowerCase();
      const matchesExtension =
        acceptedExtensions.length === 0 || acceptedExtensions.some((ext) => lowerName.endsWith(ext));
      if (!matchesExtension) {
        setError(`"${file.name}" isn't a supported file type.`);
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`"${file.name}" is larger than the ${maxSizeMB} MB limit.`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  }

  function addFiles(candidates: FileList | File[]) {
    const list = Array.from(candidates);
    if (list.length === 0) return;
    setError(null);
    const valid = validate(list);
    if (valid.length === 0) return;
    onFilesChange(multiple ? [...files, ...valid] : [valid[0]]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-12",
          isDragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50",
        )}
      >
        <UploadIcon className="h-9 w-9 text-emerald-600" />
        <div>
          <p className="font-medium text-slate-900">{label}</p>
          <p className="mt-1 text-sm text-slate-500">
            or <span className="font-medium text-emerald-700 underline">browse files</span> from your device
          </p>
        </div>
        {hint && (
          <p id={`${inputId}-hint`} className="text-xs text-slate-400">
            {hint}
          </p>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileIcon className="h-5 w-5 shrink-0 text-slate-400" />
                <span className="truncate font-medium text-slate-700">{file.name}</span>
                <span className="shrink-0 text-slate-400">{formatBytes(file.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
