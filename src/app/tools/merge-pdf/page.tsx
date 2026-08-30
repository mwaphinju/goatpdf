import type { Metadata } from "next";
import { MergePdfTool } from "@/components/tools/MergePdfTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { buildToolMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("merge-pdf")!;

export const metadata: Metadata = buildToolMetadata(tool);

export default function MergePdfPage() {
  return (
    <ToolPageLayout tool={tool}>
      <MergePdfTool />
    </ToolPageLayout>
  );
}
