import { Award, Compass } from "lucide-react";

import { accent, type AccentName } from "@/lib/accents";
import { LEVEL_STYLES, stageAnchorId } from "@/lib/levels";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/types";

/**
 * Jump-links to every stage on a path page.
 *
 * A server component that renders plain anchors — no state, no effects, no
 * JavaScript at all. Pages got considerably longer once every topic carried a
 * definition, and this is the cheapest possible way to make them navigable:
 * the browser's own fragment navigation does the work, and it keeps working
 * with JavaScript disabled.
 *
 * `scroll-padding-top` in globals.css and `scroll-mt-24` on each stage stop
 * the sticky header covering the target.
 *
 * On narrow screens the list is height-capped and scrolls internally. A ten
 * stage path would otherwise push the first stage most of a screen down, and
 * a table of contents that buries the content is worse than none.
 */
export function PathToc({
  stages,
  accentName,
}: {
  stages: Stage[];
  accentName: AccentName;
}) {
  const a = accent(accentName);

  return (
    <nav
      aria-labelledby="toc-heading"
      className="rounded-xl border border-border/60 bg-card/30 p-4 backdrop-blur-sm sm:p-5"
    >
      <h2
        id="toc-heading"
        className="font-semibold text-xs uppercase tracking-wide text-muted-foreground"
      >
        On this page
        <span className="ml-2 font-normal normal-case tracking-normal">
          {stages.length} stages
        </span>
      </h2>

      <ol
        className={cn(
          "mt-3 grid gap-x-6 gap-y-0.5",
          // Capped and scrollable on phones, fully open from `sm` up. Kept
          // deliberately short: on a 667px phone anything taller than about a
          // third of the screen buries the content it is meant to index.
          "max-h-40 overflow-y-auto overscroll-contain",
          "sm:max-h-none sm:overflow-visible sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {stages.map((stage) => {
          const level = LEVEL_STYLES[stage.level];

          return (
            <li key={stage.id}>
              <a
                href={`#${stageAnchorId(stage.id)}`}
                className="group flex items-baseline gap-2.5 rounded-md py-1.5 text-sm transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/40"
              >
                <span
                  className={cn(
                    "w-4 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground/70",
                    "transition-colors group-hover:text-foreground",
                  )}
                  aria-hidden
                >
                  {stage.kind === "certification" ? (
                    <Award className="ml-auto size-3" />
                  ) : stage.kind === "architect" ? (
                    <Compass className="ml-auto size-3" />
                  ) : (
                    stage.order
                  )}
                </span>

                {/* min-w-0 so a long stage title truncates instead of forcing
                    the grid column wider than its track. */}
                <span className="min-w-0 flex-1 truncate text-muted-foreground transition-colors group-hover:text-foreground">
                  {stage.title}
                </span>

                <span
                  className={cn(
                    "hidden shrink-0 text-[10px] uppercase tracking-wide lg:inline",
                    level.badge.split(" ").find((c) => c.startsWith("text-")),
                  )}
                  aria-hidden
                >
                  {level.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>

      {/* Hidden on phones, where the vertical space is worth more than the
          explanation. */}
      <p
        className={cn(
          "mt-3 hidden border-t border-border/50 pt-3 text-xs sm:block",
          a.text,
        )}
      >
        Every stage lists what it covers, what each term means, and where to
        read more.
      </p>
    </nav>
  );
}
