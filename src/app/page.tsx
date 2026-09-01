import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { ToolCard } from "@/components/ToolCard";
import { toolListStructuredData } from "@/lib/structuredData";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <>
      <JsonLd data={toolListStructuredData()} />

      <section className="border-b border-slate-200 bg-gradient-to-b from-emerald-50 to-white dark:border-slate-800 dark:from-emerald-950 dark:to-slate-950">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Free PDF Tools That Just Work
          </h1>
          <p className="max-w-xl text-lg text-slate-600 dark:text-slate-400">
            Compress, merge, split and convert PDF files online — quickly and easily.
          </p>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">All tools</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Pick a tool to get started — no sign-up needed.</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No accounts, no watermarks, no catch</h2>
          <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
            Every tool on this page runs the same way: upload a file, get a result, download it. There&apos;s
            nothing to sign up for and nothing added to your file. Uploaded files are processed privately
            and deleted automatically — see the{" "}
            <Link href="/privacy" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              Privacy Policy
            </Link>{" "}
            for exactly what that means, or read{" "}
            <Link href="/about" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              more about GOAT PDF
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
