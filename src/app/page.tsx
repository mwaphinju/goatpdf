import { ToolCard } from "@/components/ToolCard";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Free PDF Tools That Just Work
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Compress, merge, split and convert PDF files online — quickly and easily.
          </p>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-xl font-semibold text-slate-900">All tools</h2>
        <p className="mt-1 text-sm text-slate-500">Pick a tool to get started — no sign-up needed.</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </>
  );
}
