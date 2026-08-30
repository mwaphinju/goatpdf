import type { Metadata } from "next";
import { CompressPdfTool } from "@/components/tools/CompressPdfTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { buildToolMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("compress-pdf")!;

export const metadata: Metadata = buildToolMetadata(tool);

export default function CompressPdfPage() {
  return (
    <ToolPageLayout tool={tool}>
      <CompressPdfTool />
    </ToolPageLayout>
  );
}
