import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import type { Metadata } from "next";

import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCareerLadder, getPathSummaries } from "@/lib/content";
import { cn } from "@/lib/utils";
import type { Level } from "@/lib/types";

export const metadata: Metadata = {
  title: "Career ladder",
  description:
    "Junior to AI System Architect: what changes at each level of an AI engineering career, what you own, and what you should be doing differently to move up.",
  alternates: { canonical: "/career-ladder/" },
};

const LEVEL_STYLE: Record<Level, string> = {
  junior: "border-sky-500/40 text-sky-400",
  mid: "border-amber-500/40 text-amber-400",
  senior: "border-rose-500/40 text-rose-400",
  architect: "border-violet-500/40 text-violet-400",
};

export default function CareerLadderPage() {
  const ladder = getCareerLadder();
  const paths = getPathSummaries();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal from="none">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          {ladder.title}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          {ladder.intro}
        </p>
      </Reveal>

      <ol className="relative mt-16 space-y-6">
        <div
          className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-sky-500/40 via-rose-500/40 to-violet-500/40"
          aria-hidden
        />

        {ladder.levels.map((level, index) => (
          <li key={level.id} className="relative pl-12">
            <Reveal delay={index * 0.05}>
              <span
                className={cn(
                  "absolute left-0 top-6 flex size-8 items-center justify-center rounded-full border-2 bg-background text-xs font-semibold tabular-nums",
                  LEVEL_STYLE[level.level],
                )}
                aria-hidden
              >
                {index + 1}
              </span>

              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">
                      {level.title}
                    </h2>
                    <Badge
                      variant="outline"
                      className={cn("font-normal", LEVEL_STYLE[level.level])}
                    >
                      {level.yearsExperience}
                    </Badge>
                  </div>

                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Focus
                      </dt>
                      <dd className="mt-1 text-sm">{level.focus}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Scope
                      </dt>
                      <dd className="mt-1 text-sm">{level.scope}</dd>
                    </div>
                  </dl>

                  <p className="mt-5 border-l-2 border-border pl-4 text-sm leading-relaxed text-muted-foreground">
                    {level.guidance}
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          </li>
        ))}
      </ol>

      <Reveal className="mt-12">
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-6">
          <h2 className="flex items-center gap-2 font-semibold tracking-tight">
            <Compass className="size-5 text-violet-500" aria-hidden />
            One architect track, not seven
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {ladder.closing}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
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
