import type { Metadata } from "next";
import { CompressPdfTool } from "@/components/tools/CompressPdfTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { buildToolMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";
import { ENGLISH_TOOL_ROUTES, GERMAN_TOOL_ROUTES } from "@/i18n/toolContent";

const tool = getToolBySlug("compress-pdf")!;

export const metadata: Metadata = buildToolMetadata(tool, {
  en: ENGLISH_TOOL_ROUTES["compress-pdf"],
  de: GERMAN_TOOL_ROUTES["compress-pdf"],
});

export default function CompressPdfPage() {
  return (
    <ToolPageLayout tool={tool}>
      <CompressPdfTool />
    </ToolPageLayout>
  );
}
