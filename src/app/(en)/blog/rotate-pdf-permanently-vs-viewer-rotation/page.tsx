import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, ArticleSection } from "@/components/blog/ArticleLayout";
import { buildArticleMetadata } from "@/lib/seo";

const PATH = "/blog/rotate-pdf-permanently-vs-viewer-rotation";
const TITLE = "Rotate PDF Permanently vs. Rotating the View";
const DESCRIPTION =
  "Why rotating a PDF in your viewer sometimes doesn't stick, and what it actually means to permanently rotate the pages inside the file itself.";

export const metadata: Metadata = buildArticleMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

export default function RotatePdfPermanentlyArticle() {
  return (
    <ArticleLayout
      path={PATH}
      title={TITLE}
      description="You rotated a sideways PDF in your viewer, closed it, and reopened it sideways again. Here's why that happens, and how to actually fix it in the file."
      datePublished="2026-09-03"
      cta={{ toolName: "Rotate PDF", toolSlug: "rotate-pdf", label: "Rotate a PDF now" }}
      faqs={[
        {
          question: "Why did my PDF rotation not save?",
          answer:
            "Most likely, your PDF viewer only rotated how the page displays on your screen for that session, not the file itself. That kind of rotation resets the next time the file is opened, since nothing was actually changed or saved to disk.",
        },
        {
          question: "Does permanently rotating a page change the original file I upload?",
          answer:
            "No. GOAT PDF's Rotate PDF tool produces a new, rotated file for you to download. The file you uploaded isn't altered and is deleted from the server afterward.",
        },
        {
          question: "Can I rotate only some pages and leave the rest alone?",
          answer:
            "Yes. You can rotate every page at once, or select specific pages from a page grid and leave the rest untouched.",
        },
      ]}
    >
      <p>
        It&apos;s a strangely common frustration: you open a sideways PDF, rotate it in your viewer so it&apos;s easier
        to read, close the file, and the next time you open it, it&apos;s sideways again. It feels like a bug, but
        it isn&apos;t one. It&apos;s the difference between two things that look similar but are actually completely
        different: rotating how a page is displayed, and rotating the page itself.
      </p>

      <ArticleSection heading="Two different kinds of rotation">
        <p>
          Most PDF viewers, including the ones built into web browsers, let you rotate the current view with a
          button or a keyboard shortcut. That rotation is a display setting for your current viewing session,
          similar to zooming in or scrolling. It changes what you see right now, in that window, and nothing
          more.
        </p>
        <p>
          Permanently rotating a PDF is a different operation entirely. It changes the actual rotation value
          stored inside the file, for each page, so that every viewer, on every device, opens it the right way
          around from now on. One is a temporary display preference. The other is an edit to the file itself.
        </p>
      </ArticleSection>

      <ArticleSection heading="Why viewer rotation doesn't actually change the file">
        <p>
          A PDF file, internally, stores a rotation value for each page: 0, 90, 180, or 270 degrees. Nothing
          about the page&apos;s actual content moves. Instead, the viewer reads that value and decides how to
          display the page as a result. When you rotate the view in most readers, you&apos;re temporarily overriding
          how that page is drawn on your screen, not editing the value stored in the file.
        </p>
        <p>
          Since nothing in the file was actually modified, there&apos;s nothing to save. Close the file, and that
          temporary override disappears along with it. Reopen it, and the viewer goes back to reading the
          file&apos;s real, unedited rotation value, which is why it looks sideways again.
        </p>
      </ArticleSection>

      <ArticleSection heading="Why this catches people off guard">
        <p>
          The confusion makes sense. Rotating the view genuinely does fix the problem, visually, right in front
          of you. There&apos;s often no obvious indicator that the change is temporary rather than saved, especially
          in a quick preview window or a browser&apos;s built-in PDF viewer. It&apos;s easy to assume that because the
          page looks correct now, it&apos;s fixed for good, and only notice otherwise the next time you (or someone
          else) opens the same file and it&apos;s back to being sideways.
        </p>
      </ArticleSection>

      <ArticleSection heading="How permanent rotation actually works">
        <p>
          A tool that permanently rotates a PDF edits that stored rotation value directly and saves it as part
          of the file. Once that&apos;s done, the change isn&apos;t tied to a particular viewer or session; it&apos;s baked
          into the document itself. Any PDF reader, opening the file fresh, will read the new rotation value
          and display the page correctly from the start.
        </p>
      </ArticleSection>

      <ArticleSection heading="How to permanently rotate a PDF with GOAT PDF">
        <p>
          Upload your file to{" "}
          <Link href="/tools/rotate-pdf" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            Rotate PDF
          </Link>
          , choose a rotation angle (90, 180, or 270 degrees), and decide whether to apply it to every page or
          only a selection you pick from a page grid. Rotation is additive, so rotating a page that&apos;s already
          at 90 degrees by another 90 takes it to 180, matching what you&apos;d expect visually. Once you download
          the result, the rotation is stored in the file itself, not just displayed that way in whatever
          program happened to open it during the job.
        </p>
      </ArticleSection>

      <ArticleSection heading="Common mistakes">
        <p>
          The most common mistake is assuming a viewer&apos;s rotate button fixed the problem for good, then sending
          or saving the file without realizing the rotation never actually stuck. Another is rotating in the
          wrong direction and not noticing until later; since rotation is additive, correcting an overshoot
          usually just means rotating again by the right amount to land back where you want.
        </p>
      </ArticleSection>

      <ArticleSection heading="How to verify the rotation actually saved">
        <p>
          The simplest check: download the rotated file, close whatever program you were using entirely, then
          reopen the downloaded file from scratch, ideally in a different viewer than the one you used before.
          If it opens the right way around without you touching anything, the rotation is genuinely saved in
          the file. If you have to rotate it again to view it correctly, something didn&apos;t save, and it&apos;s worth
          re-checking which tool or step actually wrote the change to the file.
        </p>
      </ArticleSection>
    </ArticleLayout>
  );
}
