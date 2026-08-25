import { Award, Compass, PenLine } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { StageCheckbox } from "@/components/path-progress";
import { ResourceList } from "@/components/resource-list";
import { Badge } from "@/components/ui/badge";
import { accent } from "@/lib/accents";
import { LEVEL_STYLES, stageAnchorId } from "@/lib/levels";
import { cn } from "@/lib/utils";
import type { AccentName } from "@/lib/accents";
import type { Stage } from "@/lib/types";

/**
 * The ordered stages of a path.
 *
 * This is an ordered list semantically — the sequence is the content, not a
 * visual choice — so it stays legible with CSS off and in a screen reader.
 */
export function StageTimeline({
  stages,
  accentName,
  pathTitles,
  trackProgress = false,
}: {
  stages: Stage[];
  accentName: AccentName;
  /** slug -> title, for rendering `sharedWith` references. */
  pathTitles?: Record<string, string>;
  /**
   * Renders a completion toggle per stage. Requires a PathProgressProvider
   * above this component; off for the foundation, which is not tracked.
   */
  trackProgress?: boolean;
}) {
  const a = accent(accentName);

  return (
    <ol className="relative space-y-10">
      <div
        className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-border via-border to-transparent"
        aria-hidden
      />

      {stages.map((stage, index) => (
        <li
          key={stage.id}
          id={stageAnchorId(stage.id)}
          className="relative scroll-mt-24 pl-12"
        >
          <Reveal delay={Math.min(index, 6) * 0.04}>
            <span
              className={cn(
                "absolute left-0 top-0.5 flex size-8 items-center justify-center rounded-full border-2 bg-background text-sm font-semibold tabular-nums",
                stage.needsOriginalContent
                  ? "border-amber-500/60 text-amber-400"
                  : cn(a.border, a.text),
              )}
              aria-hidden
            >
              {stage.kind === "certification" ? (
                <Award className="size-4" />
              ) : stage.kind === "architect" ? (
                <Compass className="size-4" />
              ) : (
                stage.order
              )}
            </span>

            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <h3 className="text-lg font-semibold tracking-tight">
                  {stage.title}
                </h3>
                <Badge
                  variant="outline"
                  className={cn("font-normal", LEVEL_STYLES[stage.level].badge)}
                >
                  {stage.levelLabel}
                </Badge>
                {trackProgress ? (
                  <StageCheckbox stageId={stage.id} stageTitle={stage.title} />
                ) : null}
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {stage.description}
              </p>

              {stage.sharedWith && stage.sharedWith.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Shared with{" "}
                  {stage.sharedWith
                    .map((slug) => pathTitles?.[slug] ?? slug)
                    .join(", ")}
                  .
                </p>
              ) : null}

              {stage.needsOriginalContent ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-amber-400">
                    <PenLine className="size-4" aria-hidden />
                    Original content — not yet written
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {stage.note}
                  </p>
                </div>
              ) : null}

              {stage.topics.length > 0 ? (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Topics
                  </h4>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {stage.topics.map((topic) => (
                      <li key={topic}>
                        <Badge variant="secondary" className="font-normal">
                          {topic}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {stage.resources.length > 0 ? (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Resources ({stage.resources.length})
                  </h4>
                  <ResourceList resources={stage.resources} className="mt-2" />
                </div>
              ) : null}

              {stage.note && !stage.needsOriginalContent ? (
                <p className="border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground">
                  {stage.note}
                </p>
              ) : null}
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
