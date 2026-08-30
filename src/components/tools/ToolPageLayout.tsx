import type { ReactNode } from "react";
import { RelatedTools } from "@/components/tools/RelatedTools";
import type { ToolDefinition } from "@/lib/tools";

export function ToolPageLayout({ tool, children }: { tool: ToolDefinition; children: ReactNode }) {
  const Icon = tool.icon;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Icon className="h-8 w-8" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{tool.name}</h1>
          <p className="max-w-md text-slate-600">{tool.description}</p>
        </div>

        <div className="mt-8">{children}</div>
      </div>

      <RelatedTools currentSlug={tool.slug} />
    </div>
  );
}
