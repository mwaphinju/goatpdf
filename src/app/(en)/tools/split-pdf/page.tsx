import type { Metadata } from "next";
import { SplitPdfTool } from "@/components/tools/SplitPdfTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { buildToolMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";
import { ENGLISH_TOOL_ROUTES, GERMAN_TOOL_ROUTES } from "@/i18n/toolContent";

const tool = getToolBySlug("split-pdf")!;

export const metadata: Metadata = buildToolMetadata(tool, {
  en: ENGLISH_TOOL_ROUTES["split-pdf"],
  de: GERMAN_TOOL_ROUTES["split-pdf"],
});

export default function SplitPdfPage() {
  return (
    <ToolPageLayout tool={tool}>
      <SplitPdfTool />
    </ToolPageLayout>
  );
}
