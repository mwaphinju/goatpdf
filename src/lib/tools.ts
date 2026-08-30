import type { ComponentType, SVGProps } from "react";
import {
  CompressIcon,
  DeletePagesIcon,
  ImageToPdfIcon,
  MergeIcon,
  PdfToImageIcon,
  RotateIcon,
  SplitIcon,
  WordIcon,
} from "@/components/icons";

export interface ToolDefinition {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  actionLabel: string;
  accept: string;
  multiple: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const tools: ToolDefinition[] = [
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    shortName: "Compress",
    description: "Reduce PDF file size while keeping quality as high as possible.",
    actionLabel: "Compress PDF",
    accept: "application/pdf",
    multiple: false,
    icon: CompressIcon,
  },
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    shortName: "Merge",
    description: "Combine multiple PDF files into a single document.",
    actionLabel: "Merge PDFs",
    accept: "application/pdf",
    multiple: true,
    icon: MergeIcon,
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    shortName: "Split",
    description: "Extract or separate pages from a PDF into new files.",
    actionLabel: "Split PDF",
    accept: "application/pdf",
    multiple: false,
    icon: SplitIcon,
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    shortName: "Rotate",
    description: "Fix sideways or upside-down pages in seconds.",
    actionLabel: "Rotate PDF",
    accept: "application/pdf",
    multiple: false,
    icon: RotateIcon,
  },
  {
    slug: "delete-pdf-pages",
    name: "Delete PDF Pages",
    shortName: "Delete Pages",
    description: "Remove unwanted pages from a PDF document.",
    actionLabel: "Delete Pages",
    accept: "application/pdf",
    multiple: false,
    icon: DeletePagesIcon,
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    shortName: "JPG to PDF",
    description: "Turn JPG images into a single PDF document.",
    actionLabel: "Convert to PDF",
    accept: "image/jpeg",
    multiple: true,
    icon: ImageToPdfIcon,
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    shortName: "PDF to JPG",
    description: "Convert each PDF page into a JPG image.",
    actionLabel: "Convert to JPG",
    accept: "application/pdf",
    multiple: false,
    icon: PdfToImageIcon,
  },
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    shortName: "PDF to Word",
    description: "Convert a PDF into an editable Word document.",
    actionLabel: "Convert to Word",
    accept: "application/pdf",
    multiple: false,
    icon: WordIcon,
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.slug === slug);
}
