import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach GOAT PDF with questions, feedback, or a bug report.",
};

const CONTACT_EMAIL = "support@goatpdf.app";

export default function ContactPage() {
  return (
    <LegalPageLayout title="Contact" updated="August 31, 2026">
      <p>There&apos;s no support ticket system or account to sign into — just email us directly.</p>

      <LegalSection heading="Email">
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-emerald-700 hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>Because there are no accounts, we can&apos;t look up &quot;your&quot; files or history — please describe what happened, which tool you used, and roughly when, and we&apos;ll do our best to help.</p>
      </LegalSection>

      <LegalSection heading="What to contact us about">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>A tool that produced a wrong or broken result.</li>
          <li>A bug or error message that didn&apos;t make sense.</li>
          <li>A question about the <Link href="/privacy" className="font-medium text-emerald-700 hover:underline">Privacy Policy</Link> or <Link href="/terms" className="font-medium text-emerald-700 hover:underline">Terms of Service</Link>.</li>
          <li>A copyright, abuse, or takedown report.</li>
          <li>General feedback or a tool you&apos;d like to see.</li>
        </ul>
      </LegalSection>
    </LegalPageLayout>
  );
}
