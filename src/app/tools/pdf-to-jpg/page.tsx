import type { Metadata } from "next";
import { PdfToJpgTool } from "@/components/tools/PdfToJpgTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("pdf-to-jpg")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
};

export default function PdfToJpgPage() {
  return (
    <ToolPageLayout tool={tool}>
      <PdfToJpgTool />
    </ToolPageLayout>
  );
}
