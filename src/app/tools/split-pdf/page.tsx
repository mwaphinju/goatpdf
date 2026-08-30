import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("split-pdf")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
};

export default function SplitPdfPage() {
  return (
    <ToolPageLayout tool={tool}>
      <ToolPageShell accept={tool.accept} multiple={tool.multiple} actionLabel={tool.actionLabel} />
    </ToolPageLayout>
  );
}
