import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/terms",
  title: "Terms of Service",
  description: "The terms for using GOAT PDF's free PDF tools.",
});

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" updated="August 31, 2026">
      <p>
        These terms cover your use of GOAT PDF. By uploading a file or using any tool on this site, you
        agree to them. If you don&apos;t agree, please don&apos;t use the site.
      </p>

      <LegalSection heading="The service">
        <p>
          GOAT PDF provides free, browser-based tools for working with PDF files — compressing, merging,
          splitting, rotating, deleting pages, converting images to PDF, converting PDF pages to images,
          and converting PDF to Word. No account or payment is required to use any of them. See{" "}
          <Link href="/privacy" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            the Privacy Policy
          </Link>{" "}
          for exactly how your files are handled while a tool runs.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>You agree not to use GOAT PDF to:</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>Process content you don&apos;t have the legal right to process.</li>
          <li>Upload or generate content that is illegal, infringing, or harmful.</li>
          <li>Attempt to disrupt the service, bypass its rate limits or file-size limits, or probe it for vulnerabilities without authorization.</li>
          <li>Use the service to build a competing product by systematically scraping or automating it outside of normal, individual use.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Your files">
        <p>
          You retain all rights to the files you upload and the files GOAT PDF generates for you. We
          don&apos;t claim any ownership over your content. As described in the Privacy Policy, files are
          deleted automatically and are not kept as backups — you are responsible for saving the tool&apos;s
          output somewhere durable after you download it.
        </p>
      </LegalSection>

      <LegalSection heading="No guarantee of perfect results">
        <p>
          These tools are provided on an &quot;as is&quot; and &quot;as available&quot; basis. Compression results vary
          by file and are never a fixed, promised percentage — some files won&apos;t shrink much, or at all.
          PDF to Word conversion depends on how complex the original document is; formatting, tables,
          fonts, and images are not guaranteed to convert perfectly, and you should always review a
          converted document before relying on it. We make no warranty, express or implied, about the
          fitness of any tool&apos;s output for a particular purpose.
        </p>
      </LegalSection>

      <LegalSection heading="Availability">
        <p>
          GOAT PDF is a free service and may be unavailable, changed, or discontinued at any time, with or
          without notice. We&apos;ll try to keep it reliable, but we don&apos;t promise any specific level of
          uptime.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, GOAT PDF and its operator are not liable for any loss —
          including lost or corrupted files, lost time, or lost data — arising from your use of the
          service. Because temporary files are deleted automatically and are not backed up, keep your own
          copy of anything important before and after processing it here.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to these terms">
        <p>
          We may update these terms as the service changes. Continued use of GOAT PDF after an update
          means you accept the revised terms.
        </p>
      </LegalSection>

      <LegalSection heading="Questions">
        <p>
          Questions about these terms can be sent through the{" "}
          <Link href="/contact" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
