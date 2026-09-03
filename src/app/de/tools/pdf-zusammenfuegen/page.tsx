import type { Metadata } from "next";
import { MergePdfTool } from "@/components/tools/MergePdfTool";
import { GermanToolPageLayout } from "@/components/tools/GermanToolPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { germanToolContent } from "@/i18n/toolContent/de";
import { ENGLISH_TOOL_ROUTES, GERMAN_TOOL_ROUTES } from "@/i18n/toolContent";

const content = germanToolContent["merge-pdf"];
const path = GERMAN_TOOL_ROUTES["merge-pdf"];

export const metadata: Metadata = buildPageMetadata({
  path,
  title: content.seoTitle,
  description: content.metaDescription,
  locale: "de",
  alternateLanguages: { en: ENGLISH_TOOL_ROUTES["merge-pdf"], de: path },
});

export default function GermanMergePdfPage() {
  return (
    <GermanToolPageLayout slug="merge-pdf">
      <MergePdfTool locale="de" />
    </GermanToolPageLayout>
  );
}
