import type { Metadata } from "next";
import { RotatePdfTool } from "@/components/tools/RotatePdfTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("rotate-pdf")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
};

export default function RotatePdfPage() {
  return (
    <ToolPageLayout tool={tool}>
      <RotatePdfTool />
    </ToolPageLayout>
  );
}
