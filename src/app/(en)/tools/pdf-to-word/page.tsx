import type { Metadata } from "next";
import { PdfToWordTool } from "@/components/tools/PdfToWordTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { buildToolMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";
import { ENGLISH_TOOL_ROUTES, GERMAN_TOOL_ROUTES } from "@/i18n/toolContent";

const tool = getToolBySlug("pdf-to-word")!;

export const metadata: Metadata = buildToolMetadata(tool, {
  en: ENGLISH_TOOL_ROUTES["pdf-to-word"],
  de: GERMAN_TOOL_ROUTES["pdf-to-word"],
});

export default function PdfToWordPage() {
  return (
    <ToolPageLayout tool={tool}>
      <PdfToWordTool />
    </ToolPageLayout>
  );
}
