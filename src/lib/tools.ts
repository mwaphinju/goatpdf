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

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolDefinition {
  slug: string;
  name: string;
  shortName: string;
  /** Short, one-sentence blurb — used as the homepage/footer card text (on-page UI copy, not SEO metadata — see metaDescription). */
  description: string;
  /**
   * The <title> tag's content (before the root layout's "%s | GOAT PDF"
   * template appends the brand suffix), distinct from `name`, which stays
   * the on-page H1/nav/card label. Written for search intent ("online
   * free"), not as a UI label, so the two can diverge without changing
   * anything visible on the page itself.
   */
  seoTitle: string;
  /** The <meta name="description"> content — distinct from `description` (the on-page card blurb) so search-result copy can be optimized without changing visible UI text. */
  metaDescription: string;
  /** A one-line, factual statement of accepted input / produced output formats, derived from what the tool actually accepts (see `accept`) — shown on the tool page for both users and crawlers. */
  supportedFormats: string;
  /** 3 genuine, verifiable differentiators for this specific tool — privacy/process facts plus a tool-specific angle. Not identical boilerplate repeated on every page. */
  whyUseIt: string[];
  /** 2-3 genuine, concrete scenarios this tool actually solves — shown in a short "Common use cases" section. Not generic filler; each one ties to real functionality. */
  useCases: string[];
  /** Longer, on-page introduction paragraph — distinct wording from `description`, shown as real page content. */
  intro: string;
  /** Ordered steps shown in a "How to..." section on the tool's page. */
  howTo: string[];
  /** Tool-specific FAQ content — genuine, distinct questions per tool, also emitted as FAQPage structured data. */
  faqs: ToolFaq[];
  /** Curated slugs of genuinely related tools, for internal linking — not a positional/arbitrary rotation. */
  relatedSlugs: string[];
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
    seoTitle: "Compress PDF Online Free",
    metaDescription:
      "Compress PDF files online for free. Reduce file size while preserving quality. No sign-up, no watermark, and files are deleted automatically after processing.",
    supportedFormats: "PDF in, PDF out.",
    whyUseIt: [
      "No accounts, no watermark, and no fixed compression promise: just the real, measured result for your specific file.",
      "Three genuinely different presets (Recommended, High Quality, Maximum Compression) instead of one-size-fits-all compression.",
      "Uploaded and compressed files are processed privately on our server and deleted automatically afterward.",
    ],
    useCases: [
      "Getting a scanned document under an email attachment size limit",
      "Shrinking a PDF before uploading it to a form or portal with a size cap",
      "Reducing storage space for a large PDF archive",
    ],
    intro:
      "Shrink a PDF's file size without wrecking the quality of what's inside. GOAT PDF re-encodes the embedded images in your file at the compression level you choose, then reports exactly how much space you saved, never a made-up percentage.",
    howTo: [
      "Upload the PDF you want to shrink.",
      "Pick Recommended, High Quality, or Maximum Compression.",
      "Download the compressed file and compare the before/after size.",
    ],
    faqs: [
      {
        question: "How much smaller will my PDF get?",
        answer:
          "It depends entirely on what's inside the file. A PDF full of large scanned images can shrink substantially, while a text-only PDF may barely change. GOAT PDF always shows the real, measured result and never returns a file larger than what you uploaded.",
      },
      {
        question: "Will compressing reduce quality?",
        answer:
          "Some. Compression re-encodes embedded photos at a slightly lower quality to save space. Recommended balances size and quality, High Quality keeps images closer to the original, and Maximum Compression prioritizes the smallest possible file.",
      },
      {
        question: "Can I compress a PDF for email?",
        answer:
          "Yes. Many email providers cap attachments around 20–25 MB. Compress PDF is a fast way to bring a large scanned document under that limit before sending it, without installing anything.",
      },
      {
        question: "What's the difference between the three compression levels?",
        answer:
          "Recommended balances size and quality for everyday sharing. High Quality keeps images closer to the original with a smaller size reduction. Maximum Compression produces the smallest possible file, with more visible quality loss in images.",
      },
      {
        question: "Is my file safe when I compress it online?",
        answer:
          "Yes. Files are uploaded over a private connection, processed on our server, and deleted automatically after you download the result (or after a short time if you don't). See the Privacy Policy for the exact details.",
      },
    ],
    relatedSlugs: ["merge-pdf", "split-pdf", "pdf-to-word"],
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
    seoTitle: "Merge PDF Files Online Free",
    metaDescription:
      "Merge PDF files online for free. Combine multiple PDFs into one document in any order you choose. Fast, private, and no account required.",
    supportedFormats: "PDF in, PDF out.",
    whyUseIt: [
      "No accounts, no watermark on the merged file, and no page-count games: just upload, reorder, and merge.",
      "Reorder by dragging or with up/down buttons: the merged file comes out in exactly the order you set.",
      "Files are processed privately on our server and deleted automatically afterward.",
    ],
    useCases: [
      "Combining multiple scanned pages into one document",
      "Assembling a report from separate PDF sections",
      "Merging an invoice with its supporting attachments into one file",
    ],
    intro:
      "Combine two or more PDF files into a single document, in whatever order you choose. Add files, drag them into place, and merge. No watermark on the result.",
    howTo: [
      "Upload two or more PDF files.",
      "Reorder them by dragging or using the up/down buttons.",
      "Click Merge PDFs and download the combined file.",
    ],
    faqs: [
      {
        question: "Is there a limit on how many files I can merge?",
        answer: "Up to 20 PDFs at once, with a combined size limit of 200 MB across all of them.",
      },
      {
        question: "Can I change the page order after merging?",
        answer:
          "Not directly inside the merged file, but you can run the result through Rotate PDF or Delete PDF Pages afterward, or merge again starting from a different file order.",
      },
      {
        question: "Does merging change the original files?",
        answer:
          "No. Your original files aren't modified. Merging produces a new, separate combined PDF; the files you uploaded are only used to build it and are deleted afterward like any other job.",
      },
      {
        question: "Can I merge scanned PDFs?",
        answer: "Yes. Merge PDF works with any valid PDF file regardless of how it was created, including scanned documents.",
      },
      {
        question: "What happens if one of my files is corrupted?",
        answer:
          "The merge is rejected with a clear error naming the problem, rather than silently producing a broken result. Your other selected files aren't lost, so you can remove the bad one and try again.",
      },
    ],
    relatedSlugs: ["split-pdf", "compress-pdf", "jpg-to-pdf"],
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
    seoTitle: "Split PDF Online Free",
    metaDescription:
      "Split a PDF online for free. Extract specific pages or break a PDF into individual files in seconds. No software to install.",
    supportedFormats: "PDF in, PDF or ZIP out.",
    whyUseIt: [
      "See your PDF's real page count before you decide how to split it. No guessing.",
      "Two real modes: split into individual pages, or extract exactly the range you need.",
      "Files are processed privately on our server and deleted automatically after your download.",
    ],
    useCases: [
      "Pulling a single chapter or section out of a long PDF",
      "Separating a multi-invoice PDF into individual invoices",
      "Extracting one page to send instead of an entire document",
    ],
    intro:
      "Break a PDF apart: either into one file per page, or by extracting a specific range of pages into a new document. Useful for pulling a single chapter, invoice, or form out of a longer file.",
    howTo: [
      "Upload a PDF. GOAT PDF reads its page count for you.",
      "Choose to split into individual pages, or type a page range like 1-3, 5, 7-9.",
      "Download the result: a single PDF for a range, or a ZIP of individual pages.",
    ],
    faqs: [
      {
        question: "What page range formats are supported?",
        answer:
          "Comma-separated page numbers and ranges, e.g. 1-3, 5, 7-9. Invalid or out-of-range input is caught immediately, before you download anything.",
      },
      {
        question: "What do I get if I split into individual pages?",
        answer: "A ZIP file containing one PDF per page, numbered in order.",
      },
      {
        question: "Can I extract just one page from a PDF?",
        answer: "Yes. Type a single page number (e.g. 5) as your range, and Split PDF extracts just that page into its own PDF.",
      },
      {
        question: "Does splitting change my original PDF?",
        answer:
          "No. Splitting produces new file(s) from your upload; the original isn't modified, and everything is deleted from our server after processing.",
      },
      {
        question: "What if I enter an invalid page range?",
        answer:
          "You'll see a clear validation error immediately, before you even submit. For example, a range beyond the PDF's actual page count is caught right in the browser.",
      },
    ],
    relatedSlugs: ["merge-pdf", "delete-pdf-pages", "rotate-pdf"],
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
    seoTitle: "Rotate PDF Pages Online Free",
    metaDescription:
      "Rotate PDF pages online for free. Fix sideways or upside-down pages instantly, for an entire document or just the pages you choose.",
    supportedFormats: "PDF in, PDF out.",
    whyUseIt: [
      "Rotation is saved into the file itself, not just how your screen happens to display it.",
      "Rotate everything at once, or pick exactly the pages that need fixing.",
      "Files are processed privately on our server and deleted automatically afterward.",
    ],
    useCases: [
      "Fixing pages scanned in the wrong orientation",
      "Correcting a photo-to-PDF conversion that came out sideways",
      "Straightening just a few pages in an otherwise correct document",
    ],
    intro:
      "Fix pages that were scanned sideways or upside down. Rotate an entire PDF by 90°, 180°, or 270°, or pick just the pages that actually need it.",
    howTo: [
      "Upload your PDF.",
      "Choose a rotation angle and whether to apply it to every page or a selection.",
      "Download the corrected file.",
    ],
    faqs: [
      {
        question: "Can I rotate just one page in a multi-page PDF?",
        answer:
          "Yes. Choose \"Choose specific pages\" and pick exactly which pages to rotate from the page grid; the rest stay untouched.",
      },
      {
        question: "What if a page is already rotated?",
        answer:
          "Rotation is additive: rotating a page that's already at 90° by another 90° takes it to 180°, matching how PDF viewers already display it.",
      },
      {
        question: "Does this rotate the file permanently, or just how it looks on screen?",
        answer:
          "Permanently. GOAT PDF changes the actual page rotation stored in the PDF file, so it opens correctly-oriented in any viewer afterward. That's different from rotating the view in a PDF reader, which only changes how that one session displays the file and doesn't save anything.",
      },
      {
        question: "Will rotating change my original PDF?",
        answer: "No. You get a new, rotated file to download; the file you uploaded isn't altered and is deleted from our server afterward.",
      },
      {
        question: "Can I undo a rotation?",
        answer:
          "There's no direct \"undo,\" but since rotation is additive you can rotate the result again (e.g. another 90°) to correct it, or start over with your original file.",
      },
    ],
    relatedSlugs: ["delete-pdf-pages", "split-pdf", "compress-pdf"],
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
    seoTitle: "Delete PDF Pages Online Free",
    metaDescription:
      "Delete pages from a PDF online for free. Remove unwanted pages in seconds while keeping the rest of your document intact.",
    supportedFormats: "PDF in, PDF out.",
    whyUseIt: [
      "See exactly which page you're removing before you commit: a visual page grid, not a blind page number.",
      "GOAT PDF won't let you delete every page, protecting you from creating a broken, unusable file.",
      "Files are processed privately on our server and deleted automatically afterward.",
    ],
    useCases: [
      "Removing a blank cover sheet added by a scanner",
      "Deleting an outdated page before resending a document",
      "Trimming a duplicate scan from a multi-page PDF",
    ],
    intro:
      "Remove specific pages from a PDF (a blank cover sheet, a duplicate scan, an outdated section) without touching the rest of the document.",
    howTo: [
      "Upload your PDF and see its page count.",
      "Select the pages you want to remove from the page grid.",
      "Download the PDF with those pages gone.",
    ],
    faqs: [
      {
        question: "Can I delete every page?",
        answer:
          "No. GOAT PDF blocks that, both in the interface and on the server, since a PDF with zero pages isn't a usable file.",
      },
      {
        question: "Does deleting pages change the order of the rest?",
        answer: "No. The remaining pages keep their original order, just renumbered to close the gap.",
      },
      {
        question: "Can I remove more than one page at once?",
        answer: "Yes. Select as many pages as you want from the grid and they're all removed in a single download.",
      },
      {
        question: "Will deleting pages change my original PDF?",
        answer:
          "No. You get a new file with those pages removed; your original upload isn't modified and is deleted from our server afterward.",
      },
      {
        question: "Can I preview which pages I'm about to delete?",
        answer: "Yes. The page grid shows every page by number, so you can double-check your selection before downloading.",
      },
    ],
    relatedSlugs: ["split-pdf", "rotate-pdf", "compress-pdf"],
    actionLabel: "Delete Pages",
    accept: "application/pdf",
    multiple: false,
    icon: DeletePagesIcon,
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    shortName: "JPG to PDF",
    description: "Turn JPG or PNG images into a single PDF document.",
    seoTitle: "Convert JPG to PDF Online Free",
    metaDescription:
      "Convert JPG or PNG images to PDF online for free. Combine multiple images into a single PDF with your choice of page size and layout.",
    supportedFormats: "JPG or PNG in, PDF out.",
    whyUseIt: [
      "Accepts JPG and PNG together in the same batch: no need to convert formats first.",
      "Reorder your images before converting, so the PDF comes out in the right sequence.",
      "Choose page size, orientation, and margin instead of a one-size-fits-all layout.",
    ],
    useCases: [
      "Turning photographed receipts into a single PDF for an expense report",
      "Converting a stack of phone-scanned pages into one document",
      "Combining screenshots into a shareable PDF",
    ],
    intro:
      "Turn one or more JPG or PNG images into a single PDF (scanned receipts, photos of a whiteboard, a stack of pages photographed with your phone). Choose the page size, orientation, and margin, and control the order images appear in.",
    howTo: [
      "Upload your JPG or PNG images.",
      "Reorder them into the sequence you want.",
      "Pick a page size, orientation, and margin, then convert.",
    ],
    faqs: [
      {
        question: "Can I mix JPG and PNG images in one PDF?",
        answer: "Yes. Upload any combination and each becomes its own page, in the order you set.",
      },
      {
        question: 'What does "Fit to image" do?',
        answer:
          "Instead of a fixed page size like A4 or Letter, each page matches that image's own proportions, so nothing gets cropped or letterboxed.",
      },
      {
        question: "How many images can I convert at once?",
        answer: "Up to 30 images per batch, combined into a single PDF with one page per image.",
      },
      {
        question: "What page sizes are available?",
        answer: "A4, Letter, or \"Fit to image,\" where each page matches that image's own proportions instead of a fixed size.",
      },
      {
        question: "Will converting change my original images?",
        answer:
          "No. Your uploaded images aren't modified; a new PDF is generated from them and your images are deleted from our server afterward.",
      },
    ],
    relatedSlugs: ["pdf-to-jpg", "merge-pdf", "compress-pdf"],
    actionLabel: "Convert to PDF",
    accept: "image/jpeg,image/png",
    multiple: true,
    icon: ImageToPdfIcon,
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    shortName: "PDF to JPG",
    description: "Convert each PDF page into a JPG image.",
    seoTitle: "Convert PDF to JPG Online Free",
    metaDescription:
      "Convert PDF pages to JPG images online for free. Turn any page, or every page, into a high-quality image in seconds.",
    supportedFormats: "PDF in, JPG or ZIP out.",
    whyUseIt: [
      "Three real quality presets, not a single fixed output size.",
      "Convert every page, or just the ones you actually need.",
      "Get a single JPG for one page, or a ZIP for multiple: no unnecessary extra steps.",
    ],
    useCases: [
      "Getting a page as an image to paste into a slideshow or document",
      "Sharing a document on a platform that only accepts images",
      "Generating a quick visual preview of a page's contents",
    ],
    intro:
      "Convert PDF pages into JPG images: useful for pulling a single page into a slideshow, sharing a document on a platform that only accepts images, or grabbing a quick preview of a page's contents.",
    howTo: [
      "Upload your PDF and see its page count.",
      "Choose an image quality and whether to convert every page or a selection.",
      "Download a single JPG, or a ZIP if you converted more than one page.",
    ],
    faqs: [
      {
        question: "What resolution are the images?",
        answer:
          "It depends on the quality preset you choose: Low, Medium, and High each render pages at a different size and JPEG compression level, trading file size for sharpness. Higher quality means a larger, sharper image and a bigger file.",
      },
      {
        question: "What if I only convert one page?",
        answer:
          "You get a single JPG file directly, no ZIP. The ZIP only kicks in when you're converting more than one page at once.",
      },
      {
        question: "Does the output keep the same page proportions as my PDF?",
        answer:
          "Yes. Each image matches its source page's own proportions, so a portrait page produces a portrait image and a landscape page produces a landscape image.",
      },
      {
        question: "Will converting change my original PDF?",
        answer:
          "No. Your uploaded PDF isn't modified; the images are generated from it and everything is deleted from our server afterward.",
      },
      {
        question: "Can I convert just a few specific pages instead of the whole PDF?",
        answer:
          "Yes. Choose \"Select pages\" and pick exactly which pages to convert from the page grid, instead of converting the entire document.",
      },
    ],
    relatedSlugs: ["jpg-to-pdf", "compress-pdf", "split-pdf"],
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
    seoTitle: "PDF to Word Converter Online Free",
    metaDescription:
      "Convert PDF to an editable Word document online for free. Get a downloadable .docx file you can actually edit. No account required.",
    supportedFormats: "PDF in, DOCX out.",
    whyUseIt: [
      "Runs on a real, local document-conversion engine: your file never leaves our server to a third-party API.",
      "Produces a genuine, editable .docx file, not a locked preview or an image-based copy.",
      "Honest about limits: complex layouts may need manual review, and we say so before and after conversion.",
    ],
    useCases: [
      "Editing the text of a PDF you no longer have the source file for",
      "Updating a contract or form template originally received as a PDF",
      "Reusing content from a PDF report in a new Word document",
    ],
    intro:
      "Convert a PDF into an editable Word document (.docx), so you can update text, tables, and formatting instead of starting from scratch. Conversion quality depends on how complex the original PDF is.",
    howTo: [
      "Upload your PDF.",
      "Review the formatting disclaimer: conversion fidelity varies by document.",
      "Convert, download the .docx file, and check the formatting before relying on it.",
    ],
    faqs: [
      {
        question: "Will the formatting come out perfectly?",
        answer:
          "Not guaranteed. Simple, mostly-text PDFs convert cleanly, but complex layouts, tables, unusual fonts, and images may need manual fixing afterward. Always review the result before relying on it.",
      },
      {
        question: "What does the conversion actually run on?",
        answer:
          "A real, local document-conversion engine, not a third-party cloud API, so your file never leaves GOAT PDF's own server during conversion.",
      },
      {
        question: "Can I convert scanned PDFs to Word?",
        answer:
          "GOAT PDF converts the real text and layout structure already in a PDF. A scanned PDF that's just a photo of a page, with no underlying text layer, won't convert into editable text, since there's no text to extract. This tool doesn't include OCR.",
      },
      {
        question: "Is the Word file actually editable?",
        answer:
          "Yes. The output is a genuine .docx file you can open and edit directly in Microsoft Word, Google Docs, or any compatible app, not a flattened image or a read-only preview.",
      },
      {
        question: "Will converting change my original PDF?",
        answer:
          "No. Your uploaded PDF isn't modified; the Word document is generated from it, and both files are deleted from our server afterward.",
      },
    ],
    relatedSlugs: ["compress-pdf", "merge-pdf", "split-pdf"],
    actionLabel: "Convert to Word",
    accept: "application/pdf",
    multiple: false,
    icon: WordIcon,
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.slug === slug);
}

/** Curated, genuinely-related tools for internal linking — not a positional/arbitrary rotation. */
export function getRelatedTools(slug: string): ToolDefinition[] {
  const tool = getToolBySlug(slug);
  if (!tool) return [];

  return tool.relatedSlugs
    .map((relatedSlug) => getToolBySlug(relatedSlug))
    .filter((related): related is ToolDefinition => related !== undefined);
}
