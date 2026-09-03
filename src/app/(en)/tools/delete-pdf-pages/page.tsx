import type { Metadata } from "next";
import { DeletePagesTool } from "@/components/tools/DeletePagesTool";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { buildToolMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("delete-pdf-pages")!;

export const metadata: Metadata = buildToolMetadata(tool);

export default function DeletePagesPage() {
  return (
    <ToolPageLayout tool={tool}>
      <DeletePagesTool />
    </ToolPageLayout>
  );
}
