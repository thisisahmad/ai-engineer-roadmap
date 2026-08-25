import Link from "next/link";
import { AlertTriangle, ExternalLink, GraduationCap } from "lucide-react";
import type { Metadata } from "next";

import { Reveal } from "@/components/motion/reveal";
import { getCertifications, getPathSummaries } from "@/lib/content";
import { cn } from "@/lib/utils";
import type { CostTier } from "@/lib/types";

export const metadata: Metadata = {
  title: "Certifications",
  description:
    "Vendor-recognised AI and ML certifications compared: provider, cost, and which career path each one fits. AWS, Azure, Google Cloud, IBM, LangChain and Anthropic.",
  keywords: [
    "AI certifications",
    "AWS Certified AI Practitioner",
    "Google Professional Machine Learning Engineer",
    "Azure AI fundamentals",
    "machine learning certification",
  ],
  openGraph: {
    type: "website",
    title: "AI engineering certifications compared",
    description:
      "Provider, cost, and which career path each credential fits.",
    url: "/certifications/",
  },
  alternates: { canonical: "/certifications/" },
};

const COST_STYLE: Record<CostTier, string> = {
  free: "border-emerald-500/40 text-emerald-400",
  "free-audit": "border-amber-500/40 text-amber-400",
  paid: "border-border text-muted-foreground",
};

const COST_LABEL: Record<CostTier, string> = {
  free: "Free",
  "free-audit": "Free · paid cert",
  paid: "Paid",
};

/**
 * Entirely server-rendered — no client JS at all. The set is small enough
 * that filtering would cost more than it gives, so it is one sorted
 * comparison instead.
 */
export default function CertificationsPage() {
  const { intro, caveat, items } = getCertifications();
  const paths = getPathSummaries();

  const pathTitles = new Map(paths.map((path) => [path.slug, path.shortTitle]));

  // Free first, then audit-free, then paid — the ordering someone comparing
  // on cost would want.
  const order: Record<CostTier, number> = { free: 0, "free-audit": 1, paid: 2 };
  const sorted = [...items].sort(
    (a, b) => order[a.costTier] - order[b.costTier],
  );

  const freeCount = items.filter((item) => item.costTier === "free").length;

  return (
    <div>
      <header className="relative isolate overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_30%_10%,rgba(251,191,36,0.12),transparent_70%)]"
          aria-hidden
        />

        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal from="none">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              <GraduationCap className="size-3.5" aria-hidden />
              {items.length} credentials · {freeCount} free
            </p>

            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Certifications
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {intro}
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
            {caveat}
          </p>
        </Reveal>

        {/* Comparison table on wide screens. Scrolls inside its own container
            so the page body never scrolls sideways. */}
        <Reveal className="hidden md:block">
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/30">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <caption className="sr-only">
                AI and ML certifications compared by provider, cost and path
              </caption>
              <thead className="border-b border-border/60 bg-white/[0.03]">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Certification
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Provider
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Cost
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Fits which path
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/40 transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <th scope="row" className="px-5 py-4 font-medium">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-start gap-1.5 underline-offset-4 hover:underline"
                      >
                        {item.name}
                        <ExternalLink
                          className="mt-0.5 size-3 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground"
                          aria-hidden
                        />
                      </a>
                      {item.note ? (
                        <p className="mt-1 max-w-xs text-xs font-normal leading-relaxed text-muted-foreground">
                          {item.note}
                        </p>
                      ) : null}
                    </th>

                    <td className="px-5 py-4 text-muted-foreground">
                      {item.provider}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "whitespace-nowrap rounded-full border px-2 py-0.5 text-xs",
                          COST_STYLE[item.costTier],
                        )}
                      >
                        {item.cost}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <ul className="flex flex-wrap gap-1.5">
                        {item.appearsInPaths.map((slug) => (
                          <li key={slug}>
                            <Link
                              href={`/paths/${slug}/`}
                              className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-violet-500/50 hover:text-violet-300"
                            >
                              {pathTitles.get(slug) ?? slug}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* Cards below the table breakpoint. A four-column comparison does not
            survive a phone, and a horizontally scrolling table is worse than
            stacked cards for this much text. */}
        <ul className="space-y-3 md:hidden">
          {sorted.map((item, i) => (
            <li key={item.id}>
              <Reveal delay={Math.min(i, 6) * 0.04}>
                <div className="rounded-xl border border-border/60 bg-card/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium leading-tight underline-offset-4 hover:underline"
                    >
                      {item.name}
                    </a>
                    <span
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px]",
                        COST_STYLE[item.costTier],
                      )}
                    >
                      {COST_LABEL[item.costTier]}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {item.provider} · {item.cost}
                  </p>

                  {item.note ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">
                      {item.note}
                    </p>
                  ) : null}

                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {item.appearsInPaths.map((slug) => (
                      <li key={slug}>
                        <Link
                          href={`/paths/${slug}/`}
                          className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {pathTitles.get(slug) ?? slug}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
