import type { Metadata } from "next";
import { JpgToPdfTool } from "@/components/tools/JpgToPdfTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("jpg-to-pdf")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
};

export default function JpgToPdfPage() {
  return (
    <ToolPageLayout tool={tool}>
      <JpgToPdfTool />
    </ToolPageLayout>
  );
}
