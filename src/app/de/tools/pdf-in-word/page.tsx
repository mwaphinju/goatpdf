import type { Metadata } from "next";
import { PdfToWordTool } from "@/components/tools/PdfToWordTool";
import { GermanToolPageLayout } from "@/components/tools/GermanToolPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { germanToolContent } from "@/i18n/toolContent/de";
import { ENGLISH_TOOL_ROUTES, GERMAN_TOOL_ROUTES } from "@/i18n/toolContent";

const content = germanToolContent["pdf-to-word"];
const path = GERMAN_TOOL_ROUTES["pdf-to-word"];

export const metadata: Metadata = buildPageMetadata({
  path,
  title: content.seoTitle,
  description: content.metaDescription,
  locale: "de",
  alternateLanguages: { en: ENGLISH_TOOL_ROUTES["pdf-to-word"], de: path },
});

export default function GermanPdfToWordPage() {
  return (
    <GermanToolPageLayout slug="pdf-to-word">
      <PdfToWordTool locale="de" />
    </GermanToolPageLayout>
  );
}
