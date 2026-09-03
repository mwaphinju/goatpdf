import type { Metadata } from "next";
import { SplitPdfTool } from "@/components/tools/SplitPdfTool";
import { GermanToolPageLayout } from "@/components/tools/GermanToolPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { germanToolContent } from "@/i18n/toolContent/de";
import { ENGLISH_TOOL_ROUTES, GERMAN_TOOL_ROUTES } from "@/i18n/toolContent";

const content = germanToolContent["split-pdf"];
const path = GERMAN_TOOL_ROUTES["split-pdf"];

export const metadata: Metadata = buildPageMetadata({
  path,
  title: content.seoTitle,
  description: content.metaDescription,
  locale: "de",
  alternateLanguages: { en: ENGLISH_TOOL_ROUTES["split-pdf"], de: path },
});

export default function GermanSplitPdfPage() {
  return (
    <GermanToolPageLayout slug="split-pdf">
      <SplitPdfTool locale="de" />
    </GermanToolPageLayout>
  );
}
