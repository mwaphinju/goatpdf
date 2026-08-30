import type { Metadata } from "next";
import { CompressPdfTool } from "@/components/tools/CompressPdfTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("compress-pdf")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
};

export default function CompressPdfPage() {
  return (
    <ToolPageLayout tool={tool}>
      <CompressPdfTool />
    </ToolPageLayout>
  );
}
