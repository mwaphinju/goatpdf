import type { Metadata } from "next";
import { SplitPdfTool } from "@/components/tools/SplitPdfTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { buildToolMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("split-pdf")!;

export const metadata: Metadata = buildToolMetadata(tool);

export default function SplitPdfPage() {
  return (
    <ToolPageLayout tool={tool}>
      <SplitPdfTool />
    </ToolPageLayout>
  );
}
