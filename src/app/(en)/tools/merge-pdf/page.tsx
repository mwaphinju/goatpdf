import type { Metadata } from "next";
import { MergePdfTool } from "@/components/tools/MergePdfTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { buildToolMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";
import { ENGLISH_TOOL_ROUTES, GERMAN_TOOL_ROUTES } from "@/i18n/toolContent";

const tool = getToolBySlug("merge-pdf")!;

export const metadata: Metadata = buildToolMetadata(tool, {
  en: ENGLISH_TOOL_ROUTES["merge-pdf"],
  de: GERMAN_TOOL_ROUTES["merge-pdf"],
});

export default function MergePdfPage() {
  return (
    <ToolPageLayout tool={tool}>
      <MergePdfTool />
    </ToolPageLayout>
  );
}
