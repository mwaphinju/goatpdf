import type { Metadata } from "next";
import { PdfToWordTool } from "@/components/tools/PdfToWordTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { buildToolMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("pdf-to-word")!;

export const metadata: Metadata = buildToolMetadata(tool);

export default function PdfToWordPage() {
  return (
    <ToolPageLayout tool={tool}>
      <PdfToWordTool />
    </ToolPageLayout>
  );
}
