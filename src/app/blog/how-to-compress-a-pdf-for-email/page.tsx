import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, ArticleSection } from "@/components/blog/ArticleLayout";
import { buildArticleMetadata } from "@/lib/seo";

const PATH = "/blog/how-to-compress-a-pdf-for-email";
const TITLE = "How to Compress a PDF for Email";
const DESCRIPTION =
  "A practical guide to shrinking a PDF that's too big to email: why attachments hit size limits, what actually makes a PDF large, and how to fix it.";

export const metadata: Metadata = buildArticleMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

export default function CompressPdfForEmailArticle() {
  return (
    <ArticleLayout
      path={PATH}
      title={TITLE}
      description="Why PDFs get too big to email, what's actually happening when you compress one, and what to do if it's still too large afterward."
      datePublished="2026-09-03"
      cta={{ toolName: "Compress PDF", toolSlug: "compress-pdf", label: "Compress a PDF now" }}
      faqs={[
        {
          question: "What's the actual attachment size limit for Gmail and Outlook?",
          answer:
            "As of this writing, Gmail's personal account limit is 25 MB per message (per Google's own help documentation), and Outlook.com's standard attachment limit is also 25 MB (per Microsoft's own support documentation). Work or school email accounts can have different limits set by an administrator, so check with your organization if you're unsure.",
        },
        {
          question: "Will compressing my PDF make the text blurry?",
          answer:
            "No. PDF compression tools, including GOAT PDF's, work by re-encoding embedded images, not by altering the actual text. Text stays sharp at any compression level; it's only photos and scanned pages that can lose some visual quality.",
        },
        {
          question: "Is it safe to compress a sensitive PDF online?",
          answer:
            "Check the privacy policy of whatever tool you use before uploading anything sensitive. GOAT PDF processes files on its own server and deletes them automatically afterward; it doesn't require an account and doesn't keep a copy.",
        },
      ]}
    >
      <p>
        You&apos;ve attached a PDF to an email, hit send, and gotten a bounce-back message saying the file is too
        large. It&apos;s one of the most common small annoyances in day-to-day work, and it usually happens for a
        reason that has nothing to do with how many pages the document has.
      </p>

      <ArticleSection heading="Why PDF attachments hit a size limit">
        <p>
          Every email provider caps how large a single message (including its attachments) can be. As of this
          writing, Gmail allows up to 25 MB per message for personal accounts, according to Google&apos;s own help
          documentation. Outlook.com has the same 25 MB limit for standard attachments, according to
          Microsoft&apos;s own support pages. Work and school accounts can be different since an administrator sets
          the policy, so if you&apos;re on a company email address, it&apos;s worth checking with your IT team if you
          keep hitting a wall.
        </p>
        <p>
          Those limits exist for practical reasons: large attachments slow down mail servers, eat into storage
          quotas, and can time out on a slow connection. The limit isn&apos;t arbitrary, but it&apos;s also not something
          you can talk your way around. If your file is bigger than the cap, it simply won&apos;t send.
        </p>
      </ArticleSection>

      <ArticleSection heading="What actually makes a PDF large">
        <p>
          A PDF&apos;s file size almost never comes from the text inside it. Plain text is tiny; a 50-page report
          made entirely of formatted text might only be a few hundred kilobytes. What actually drives file size
          up is images: scanned pages, embedded photos, screenshots, and high-resolution graphics.
        </p>
        <p>
          This is why a scanned contract or a photo-heavy brochure can balloon to 10, 20, or even 100 MB, while
          a Word document exported straight to PDF from a text editor stays small. Each scanned page is
          essentially a photograph of that page, and photographs, especially ones scanned at high resolution,
          take up a lot of space. If your PDF is mostly images, that&apos;s almost always where the size is coming
          from.
        </p>
      </ArticleSection>

      <ArticleSection heading="How PDF compression actually works">
        <p>
          At a practical level, compressing a PDF means re-encoding the images inside it: reducing their
          resolution and adjusting the quality of the image format so they take up less space on disk. The
          document&apos;s structure (its pages, its text, its layout) stays exactly the same. What changes is how
          efficiently the embedded photos are stored.
        </p>
        <p>
          This is a genuinely different process from, say, zipping a file. A ZIP archive just packs the same
          bytes more tightly; PDF compression actually changes the images themselves, trading a small amount of
          visual fidelity for a real reduction in size. That&apos;s also why the result depends entirely on what&apos;s
          inside your specific file. A text-only PDF might barely shrink at all, because there&apos;s nothing to
          re-encode. An image-heavy scan can shrink dramatically.
        </p>
      </ArticleSection>

      <ArticleSection heading="How to compress a PDF for email using GOAT PDF">
        <p>
          Open{" "}
          <Link href="/tools/compress-pdf" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            Compress PDF
          </Link>{" "}
          and upload the file you&apos;re trying to send. You&apos;ll see three presets: Recommended, High Quality, and
          Maximum Compression. Recommended is a sensible default for most email attachments, balancing size and
          quality. If your file is still too large afterward, Maximum Compression pushes harder on the same
          re-encoding process, at the cost of somewhat more visible quality loss in any images.
        </p>
        <p>
          Once processing finishes, GOAT PDF shows the actual, measured before-and-after size, not an estimate.
          Compare that number to your email provider&apos;s limit before you try attaching it again. If the file
          started out well over the limit, it&apos;s worth trying Maximum Compression directly rather than starting
          with Recommended and working your way up.
        </p>
      </ArticleSection>

      <ArticleSection heading="How compression can affect quality">
        <p>
          Text and vector content (the actual letters, lines, and shapes in a PDF) aren&apos;t affected by
          compression at all; they stay exactly as sharp as the original. What can change is the visual quality
          of embedded photos and scanned pages, since those are the parts actually being re-encoded. At
          Recommended or High Quality settings, this is usually hard to notice at normal reading size. At
          Maximum Compression, you may see more visible softness in photos, particularly if you zoom in.
        </p>
        <p>
          A well-built compression tool should never hand you back a file larger than what you uploaded. If
          recompressing genuinely wouldn&apos;t help (for example, a PDF that&apos;s already been through compression
          once), the honest result is little to no change in size, not a fake percentage. That&apos;s the behavior
          to expect and, frankly, the behavior worth being suspicious of a tool for not having.
        </p>
      </ArticleSection>

      <ArticleSection heading="If the compressed PDF is still too large">
        <p>
          Sometimes even Maximum Compression isn&apos;t enough, especially with very long scanned documents. A few
          practical options at that point:
        </p>
        <p>
          First, consider whether the recipient actually needs every page in one file. If the document is
          logically split into sections (a report with several chapters, a set of scanned invoices, a packet of
          forms), you may be better off separating it and sending only the relevant part, or sending the parts
          separately.
        </p>
        <p>
          Second, check whether your email provider offers a cloud-link fallback. Gmail, for instance,
          automatically offers to attach very large files as a Google Drive link instead of a direct
          attachment. That sidesteps the size limit entirely, though it does mean the recipient needs to click
          through to a hosted file rather than getting it directly in their inbox.
        </p>
      </ArticleSection>

      <ArticleSection heading="When splitting a PDF is the better option">
        <p>
          Compression and splitting solve different problems, and it&apos;s worth knowing which one you actually
          need. Compression reduces the file size of the whole document while keeping it as one file. Splitting
          breaks a document into smaller pieces, each with its own, naturally smaller size.
        </p>
        <p>
          If your PDF is a single continuous document that needs to stay in one file (a contract, for example),
          compression is the right tool. If it&apos;s really several distinct things bundled together (scanned
          receipts from a whole month, several unrelated reports), splitting it with{" "}
          <Link href="/tools/split-pdf" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            Split PDF
          </Link>{" "}
          and sending only what&apos;s relevant is often more useful to the recipient anyway, independent of the
          size problem.
        </p>
      </ArticleSection>

      <ArticleSection heading="A note on privacy when compressing online">
        <p>
          Whenever you upload a document to any online tool, it&apos;s worth knowing what actually happens to it.
          GOAT PDF processes your file on its own server (not a third party&apos;s), doesn&apos;t require an account, and
          deletes both the upload and the result automatically after processing. There&apos;s no long-term storage
          and nothing tied to your identity. If you&apos;re compressing something sensitive, that&apos;s a reasonable
          baseline to expect from any tool you use, not just this one.
        </p>
      </ArticleSection>
    </ArticleLayout>
  );
}
