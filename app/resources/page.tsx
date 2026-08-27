import { AlertTriangle, BookOpen } from "lucide-react";
import type { Metadata } from "next";

import { Reveal } from "@/components/motion/reveal";
import { ResourceBrowser } from "@/components/resource-browser";
import { getPathSummaries, getResourceLibrary } from "@/lib/content";

export const metadata: Metadata = {
  title: "Resource library",
  description:
    "Free courses, docs and video series for AI engineering, filterable by career path. Marked clearly where a course is free to learn from but the certificate is paid.",
  keywords: [
    "free AI courses",
    "machine learning resources",
    "LLM learning resources",
    "AI engineering courses",
  ],
  openGraph: {
    type: "website",
    title: "AI engineering resource library",
    description:
      "Free courses, docs and video series, filterable by career path.",
    url: "/resources/",
  },
  alternates: { canonical: "/resources/" },
};

/**
 * Server component. It reads the library at build time and hands the whole
 * list to the browser component, which filters presentationally — nothing is
 * fetched client-side and every resource is in the prerendered HTML.
 */
export default function ResourcesPage() {
  const library = getResourceLibrary();
  const paths = getPathSummaries();

  const pathOptions = [
    { slug: "foundation", label: "Foundation" },
    ...paths.map((path) => ({ slug: path.slug, label: path.shortTitle })),
  ];

  const freeCount = library.items.filter((item) => item.cost === "free").length;

  return (
    <div>
      <header className="relative isolate overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_30%_10%,rgba(139,92,246,0.14),transparent_70%)]"
          aria-hidden
        />

        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal from="none">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
              <BookOpen className="size-3.5" aria-hidden />
              {library.items.length} resources · {freeCount} fully free
            </p>

            <h1 className="text-balance text-4xl tracking-tight sm:text-5xl">
              Resource library
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {library.intro}
            </p>
          </Reveal>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Reveal className="mb-10">
          <p className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-relaxed text-muted-foreground">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-amber-400"
              aria-hidden
            />
            {library.caveat}
          </p>
        </Reveal>

        <ResourceBrowser
          items={library.items}
          categories={library.categories}
          pathOptions={pathOptions}
        />
      </div>
    </div>
  );
}
