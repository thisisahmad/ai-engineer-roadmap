"use client";

import { useEffect, useState } from "react";

import { LEVEL_STYLES, stageAnchorId } from "@/lib/levels";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/types";

/**
 * Sticky rail beside the stage list that tracks reading position.
 *
 * Desktop only. On narrower screens the static PathToc at the top of the page
 * already covers navigation, and a sticky column would eat a third of a phone
 * screen for the whole scroll.
 *
 * Uses one IntersectionObserver over the stage headings rather than a scroll
 * listener, so nothing runs on the main thread between intersections. The
 * observer is the only client-side cost this adds to the route.
 */
export function StageScrollNav({ stages }: { stages: Stage[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const targets = stages
      .map((stage) => document.getElementById(stageAnchorId(stage.id)))
      .filter((el): el is HTMLElement => el !== null);

    if (targets.length === 0) return;

    /**
     * Decide from geometry, not from accumulated observer state.
     *
     * The first version kept a Set of intersecting ids and highlighted the
     * first one still in it. A scroll that jumps several stages at once does
     * not always produce a leaving entry for every element it passed, so ids
     * stayed in the Set and the marker stuck on stage one. Measuring on each
     * callback is a handful of reads and cannot drift out of sync.
     */
    const ACTIVE_LINE = 140; // px from the top, just under the sticky header

    const pick = () => {
      let current = targets[0];
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= ACTIVE_LINE) current = target;
        else break;
      }
      setActiveId(current.id);
    };

    // The observer is only a cheap trigger — it fires when any stage enters or
    // leaves, and `pick` does the deciding.
    const observer = new IntersectionObserver(pick, {
      rootMargin: "-100px 0px -40% 0px",
      threshold: 0,
    });

    for (const target of targets) observer.observe(target);
    pick();

    // Covers long scrolls between intersections, and resize changing what is
    // where. Passive, and `pick` is a few rect reads.
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [stages]);

  return (
    <nav
      aria-label="Stage navigation"
      className="sticky top-24 hidden max-h-[calc(100dvh-8rem)] overflow-y-auto lg:block"
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Stages
      </p>

      <ol className="space-y-0.5 border-l border-border/60">
        {stages.map((stage) => {
          const anchor = stageAnchorId(stage.id);
          const active = activeId === anchor;
          const level = LEVEL_STYLES[stage.level];

          return (
            <li key={stage.id}>
              <a
                href={`#${anchor}`}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "-ml-px flex items-baseline gap-2 border-l-2 py-1.5 pl-3 text-sm transition-colors",
                  active
                    ? cn("border-current font-medium", level.marker.split(" ").find((c) => c.startsWith("text-")))
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <span
                  className="w-4 shrink-0 text-right font-mono text-[11px] tabular-nums opacity-70"
                  aria-hidden
                >
                  {stage.order}
                </span>
                <span className="min-w-0 flex-1 truncate">{stage.title}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
