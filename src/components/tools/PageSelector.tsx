"use client";

import { cn } from "@/lib/cn";

export interface PageSelectorProps {
  pageCount: number;
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
  label: string;
}

export function PageSelector({ pageCount, selected, onChange, label }: PageSelectorProps) {
  function toggle(pageNumber: number) {
    const next = new Set(selected);
    if (next.has(pageNumber)) {
      next.delete(pageNumber);
    } else {
      next.add(pageNumber);
    }
    onChange(next);
  }

  function selectAll() {
    onChange(new Set(Array.from({ length: pageCount }, (_, index) => index + 1)));
  }

  function selectNone() {
    onChange(new Set());
  }

  function invertSelection() {
    const next = new Set<number>();
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      if (!selected.has(pageNumber)) next.add(pageNumber);
    }
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          {label} — {selected.size} of {pageCount} selected
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={selectNone}
            className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Select none
          </button>
          <button
            type="button"
            onClick={invertSelection}
            className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Invert
          </button>
        </div>
      </div>

      <div role="group" aria-label={label} className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => {
          const isSelected = selected.has(pageNumber);
          return (
            <button
              key={pageNumber}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Page ${pageNumber}`}
              onClick={() => toggle(pageNumber)}
              className={cn(
                "flex h-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                isSelected
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:bg-slate-800",
              )}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
