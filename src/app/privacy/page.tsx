import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How GOAT PDF handles your files: what's stored, for how long, and what's never collected.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="August 31, 2026">
      <p>
        GOAT PDF is built to need as little of your data as possible. There are no accounts, no sign-up,
        and no profile tied to you — you upload a file, a tool processes it, and you download the result.
        This page describes, as accurately as we can, exactly what happens to your file and your data in
        between.
      </p>

      <LegalSection heading="How your files are handled">
        <p>
          When you use a tool, your file is uploaded to our server and processed there — PDF tools need
          real processing (page manipulation, image re-encoding, document conversion) that can&apos;t be
          done reliably in a browser alone. While a job is running, your file is stored in a private,
          temporary folder on the server, named with a randomly generated identifier rather than anything
          derived from your file or your identity.
        </p>
        <p>
          That folder is never publicly listed or browsable. The only way to retrieve a result is through
          a single-use download link tied to that random job — once you download it, the link stops
          working and the underlying file is deleted. Nobody else can guess or reuse your link.
        </p>
        <p>No one manually views, reviews, or inspects your files. They are not used to train any model.</p>
      </LegalSection>

      <LegalSection heading="When your files are deleted">
        <p>
          Uploaded and generated files are deleted immediately after a successful download, on a
          best-effort basis. As a backstop for files that are never downloaded — an abandoned upload, a
          closed browser tab, a failed job — an automatic cleanup sweep runs every 15 minutes and removes
          any temporary job folder older than 1 hour. In practice, that means a file that&apos;s never
          downloaded is removed within roughly an hour, and never later than about 75 minutes.
        </p>
        <p>
          We don&apos;t keep backups of uploaded or generated files, and there is no database of past
          jobs — once a file is deleted, it&apos;s gone.
        </p>
      </LegalSection>

      <LegalSection heading="What we don't do">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>No user accounts, no login, no persistent profile.</li>
          <li>No cookies and no browser storage used to identify or track you.</li>
          <li>No analytics or tracking scripts of any kind, currently.</li>
          <li>No advertising, currently.</li>
          <li>No sharing of file contents with any third party.</li>
          <li>No OCR, no AI features, and files are never used to train a model.</li>
        </ul>
        <p>
          If that ever changes — for example, if we add advertising in the future — this policy will be
          updated first, and it will continue to describe accurately what is and isn&apos;t collected.
        </p>
      </LegalSection>

      <LegalSection heading="What we log">
        <p>
          Our server logs are deliberately narrow. For each job, we log a job ID (the same random
          identifier used for the temp folder — not derived from your file), which tool was used, whether
          it started, succeeded, failed, or timed out, a general error category if something went wrong,
          and how long processing took. Log entries structurally cannot include file contents, extracted
          text, or the filename you uploaded — the logging code only accepts that narrow set of fields, so
          there isn&apos;t a path for file data to end up in a log by mistake.
        </p>
      </LegalSection>

      <LegalSection heading="IP addresses and abuse prevention">
        <p>
          To keep the processing tools available and stop scripted abuse, requests are rate-limited per IP
          address. The IP address used for this is read from the request and held only in an in-memory
          counter — it is not written to disk, not stored in a database, and not linked to any file you
          upload. Those counters are cleared automatically as they expire, and reset completely if the
          server restarts.
        </p>
      </LegalSection>

      <LegalSection heading="Security measures">
        <p>Some of the concrete things GOAT PDF does to keep uploads private and the service reliable:</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>Every upload is validated server-side by size, extension, and the actual file content (not just its name or claimed type).</li>
          <li>Temporary files and folders use cryptographically random identifiers, never sequential IDs or your original filename.</li>
          <li>Download links are single-use and tied to that same random identifier.</li>
          <li>Processing runs under a timeout, so no job can run indefinitely.</li>
          <li>Standard security headers (including a content security policy) are set on every response.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Being honest about limits">
        <p>
          This page describes how GOAT PDF is actually built today, not a legal certification or a
          guarantee against every possible failure. No automated system is perfectly infallible — for
          example, a server crash mid-job could in principle leave a temporary file for the periodic sweep
          to catch rather than an immediate deletion. We don&apos;t claim compliance with any specific data
          protection framework; this is a description of a small, self-hosted service, not a formal
          certification.
        </p>
      </LegalSection>

      <LegalSection heading="Questions">
        <p>
          If you have a question about how your data is handled, see the{" "}
          <Link href="/contact" className="font-medium text-emerald-700 hover:underline">
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
