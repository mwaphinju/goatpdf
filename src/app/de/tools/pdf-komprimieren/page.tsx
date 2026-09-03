import type { Metadata } from "next";
import { CompressPdfTool } from "@/components/tools/CompressPdfTool";
import { GermanToolPageLayout } from "@/components/tools/GermanToolPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { germanToolContent } from "@/i18n/toolContent/de";
import { ENGLISH_TOOL_ROUTES, GERMAN_TOOL_ROUTES } from "@/i18n/toolContent";

const content = germanToolContent["compress-pdf"];
const path = GERMAN_TOOL_ROUTES["compress-pdf"];

export const metadata: Metadata = buildPageMetadata({
  path,
  title: content.seoTitle,
  description: content.metaDescription,
  locale: "de",
  alternateLanguages: { en: ENGLISH_TOOL_ROUTES["compress-pdf"], de: path },
});

export default function GermanCompressPdfPage() {
  return (
    <GermanToolPageLayout slug="compress-pdf">
      <CompressPdfTool locale="de" />
    </GermanToolPageLayout>
  );
}
