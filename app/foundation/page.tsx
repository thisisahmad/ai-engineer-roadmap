import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

import { Reveal } from "@/components/motion/reveal";
import { StageTimeline } from "@/components/stage-timeline";
import { Button } from "@/components/ui/button";
import { getFoundation, getPathSummaries } from "@/lib/content";
import { countResources } from "@/lib/stages";

export const metadata: Metadata = {
  title: "Shared Foundation",
  description:
    "Stage 0 for every AI engineering path: programming fundamentals, developer essentials, networking, APIs and databases, and the developer toolchain.",
  alternates: { canonical: "/foundation/" },
};

/**
 * The shared foundation lives in one file rather than being copied into all
 * seven paths, so it gets one page and every path links here.
 */
export default function FoundationPage() {
  const foundation = getFoundation();
  const paths = getPathSummaries();

  const resourceCount = countResources(foundation.stages);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal from="none">
        <p className="text-sm font-medium text-violet-400">
          {foundation.subtitle}
        </p>
        <h1 className="mt-3 text-balance text-4xl tracking-tight sm:text-5xl">
          {foundation.title}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          {foundation.description}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          {foundation.stages.length} stages · {resourceCount} resources · shared
          by all {paths.length} paths
        </p>
      </Reveal>

      <div className="mt-16">
        <StageTimeline stages={foundation.stages} accentName="violet" />
      </div>

      <Reveal className="mt-16">
        <div className="rounded-xl border border-border/60 p-6">
          <h2 className="font-semibold tracking-tight">Then pick a path</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            All seven assume everything above. They diverge from here.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {paths.map((path) => (
              <li key={path.slug}>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/paths/${path.slug}/`}>
                    {path.shortTitle}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
