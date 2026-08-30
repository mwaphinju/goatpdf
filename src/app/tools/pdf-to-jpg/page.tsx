import type { Metadata } from "next";
import { PdfToJpgTool } from "@/components/tools/PdfToJpgTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { buildToolMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("pdf-to-jpg")!;

export const metadata: Metadata = buildToolMetadata(tool);

export default function PdfToJpgPage() {
  return (
    <ToolPageLayout tool={tool}>
      <PdfToJpgTool />
    </ToolPageLayout>
  );
}
