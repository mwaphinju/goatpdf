import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { tools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "About",
  description: "What GOAT PDF is, and why it's built the way it is.",
};

export default function AboutPage() {
  return (
    <LegalPageLayout title="About GOAT PDF" updated="August 31, 2026">
      <p>
        GOAT PDF is a free set of PDF tools that just work — no account, no watermark, no upsell. Upload a
        file, run a tool, download the result.
      </p>

      <LegalSection heading="The tools">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {tools.map((tool) => (
            <li key={tool.slug}>
              <Link href={`/tools/${tool.slug}`} className="font-medium text-emerald-700 hover:underline">
                {tool.name}
              </Link>
              {" — "}
              {tool.description}
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection heading="Why it's built this way">
        <p>
          Most free PDF tools online push you toward an account, a subscription, or an app install
          somewhere along the way. GOAT PDF is deliberately kept to one job: eight common PDF tasks, done
          well, with nothing else attached. There&apos;s no login because there&apos;s nothing to log into —
          every visit works the same way, whether it&apos;s your first or your hundredth.
        </p>
      </LegalSection>

      <LegalSection heading="How it works">
        <p>
          Your file is uploaded to our server, processed by the tool you picked, and made available at a
          private, single-use download link. Files aren&apos;t kept afterward — see the{" "}
          <Link href="/privacy" className="font-medium text-emerald-700 hover:underline">
            Privacy Policy
          </Link>{" "}
          for the specifics of what&apos;s stored, for how long, and what&apos;s logged.
        </p>
      </LegalSection>

      <LegalSection heading="How it's funded">
        <p>
          GOAT PDF is currently free to use with no ads. Advertising may be added in the future to help
          cover hosting costs, but the tools themselves will stay free and won&apos;t require an account.
        </p>
      </LegalSection>

      <LegalSection heading="Get in touch">
        <p>
          Found a bug, or have feedback? Visit the{" "}
          <Link href="/contact" className="font-medium text-emerald-700 hover:underline">
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
