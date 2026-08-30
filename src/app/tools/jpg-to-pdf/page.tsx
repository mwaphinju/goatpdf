import type { Metadata } from "next";
import { JpgToPdfTool } from "@/components/tools/JpgToPdfTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { buildToolMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("jpg-to-pdf")!;

export const metadata: Metadata = buildToolMetadata(tool);

export default function JpgToPdfPage() {
  return (
    <ToolPageLayout tool={tool}>
      <JpgToPdfTool />
    </ToolPageLayout>
  );
}
