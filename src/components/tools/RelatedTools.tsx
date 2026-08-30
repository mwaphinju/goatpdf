import { ToolCard } from "@/components/ToolCard";
import { getRelatedTools } from "@/lib/tools";

export function RelatedTools({ currentSlug }: { currentSlug: string }) {
  const related = getRelatedTools(currentSlug);
  if (related.length === 0) return null;

  return (
    <div className="mt-16 border-t border-slate-200 pt-10">
      <h2 className="text-lg font-semibold text-slate-900">Related tools</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {related.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </div>
  );
}
