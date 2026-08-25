import Link from "next/link";
import { ExternalLink, Info } from "lucide-react";
import type { Metadata } from "next";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { getCertifications, getPathSummaries } from "@/lib/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Certifications",
  description:
    "Vendor-recognised AI and machine learning certifications referenced across the seven career paths — AWS, Azure, Google Cloud, IBM, LangChain and Anthropic — with cost and which path recommends each.",
  alternates: { canonical: "/certifications/" },
};

/** Free credentials are worth surfacing visually — they are the low-risk start. */
function costStyle(cost: string) {
  if (cost.toLowerCase() === "free") {
    return "border-emerald-500/40 text-emerald-400";
  }
  if (cost.toLowerCase().includes("audit free")) {
    return "border-sky-500/40 text-sky-400";
  }
  return "border-amber-500/40 text-amber-400";
}

export default function CertificationsPage() {
  const { intro, caveat, items } = getCertifications();
  const paths = getPathSummaries();
  const titleBySlug = Object.fromEntries(
    paths.map((path) => [path.slug, path.shortTitle]),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal from="none">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Certifications
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          {intro}
        </p>
      </Reveal>

      <Reveal className="mt-8">
        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <Info className="mt-0.5 size-5 shrink-0 text-amber-500" aria-hidden />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {caveat}
          </p>
        </div>
      </Reveal>

      <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
        {items.map((cert) => (
          <StaggerItem key={cert.id}>
            <article className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {cert.provider}
                  </p>
                  <h2 className="mt-1 font-semibold leading-snug tracking-tight">
                    {cert.name}
                  </h2>
                </div>
                <Badge
                  variant="outline"
                  className={cn("shrink-0 font-normal", costStyle(cert.cost))}
                >
                  {cert.cost}
                </Badge>
              </div>

              {cert.note ? (
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {cert.note}
                </p>
              ) : (
                <div className="flex-1" />
              )}

              {cert.appearsInPaths.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">
                    Recommended by
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {cert.appearsInPaths.map((slug) => (
                      <li key={slug}>
                        <Link href={`/paths/${slug}/`}>
                          <Badge
                            variant="secondary"
                            className="font-normal transition-colors hover:bg-accent"
                          >
                            {titleBySlug[slug] ?? slug}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <a
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-violet-500 transition-colors hover:text-violet-400"
              >
                Official page
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
