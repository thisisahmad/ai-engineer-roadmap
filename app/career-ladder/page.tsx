import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import type { Metadata } from "next";

import { CareerLadderTimeline } from "@/components/career-ladder-timeline";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { getCareerLadder, getPathSummaries } from "@/lib/content";

export const metadata: Metadata = {
  title: "Career ladder",
  description:
    "Junior to AI System Architect: what changes at each level of an AI engineering career, what you own at each rung, and the skills that separate one level from the last.",
  keywords: [
    "AI engineer career ladder",
    "junior to senior AI engineer",
    "AI system architect",
    "AI engineering levels",
  ],
  openGraph: {
    type: "article",
    title: "Career ladder — junior to AI System Architect",
    description:
      "What changes at each level of an AI engineering career, and the skills that separate one rung from the last.",
    url: "/career-ladder/",
  },
  alternates: { canonical: "/career-ladder/" },
};

export default function CareerLadderPage() {
  const ladder = getCareerLadder();
  const paths = getPathSummaries();

  return (
    <div>
      <header className="relative isolate overflow-hidden border-b border-border/60">
        {/* Same violet-to-amber language as the hero, done with gradients
            rather than a WebGL pass — this page is for reading. */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_25%_10%,rgba(139,92,246,0.16),transparent_70%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_50%_at_85%_30%,rgba(251,191,36,0.10),transparent_70%)]"
          aria-hidden
        />

        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal from="none">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
              <Compass className="size-3.5" aria-hidden />
              Shared by all {paths.length} paths
            </p>

            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {ladder.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {ladder.intro}
            </p>
          </Reveal>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <CareerLadderTimeline levels={ladder.levels} />

        <Reveal className="mt-16">
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Compass className="size-5 text-amber-400" aria-hidden />
              One architect track, not seven
            </h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
              {ladder.closing}
            </p>

            <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pick the path underneath it
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
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
    </div>
  );
}
