import { Award, Compass, PenLine } from "lucide-react";

import { ScrollReveal } from "@/components/motion/scroll-reveal";
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

      {stages.map((stage) => (
        <li
          key={stage.id}
          id={stageAnchorId(stage.id)}
          className="relative scroll-mt-24 pl-12"
        >
          {/* Outside the reveal on purpose. GSAP leaves a transform on the
              wrapper, and a transformed element becomes the containing block
              for absolutely positioned descendants — this badge would resolve
              left-0 against the wrapper (inset by pl-12) instead of the li,
              and land on top of the title. It is rail furniture, not card
              content, so it should not animate with the card anyway. */}
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

          <ScrollReveal distance={28}>

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

              {/* The plain-language explanation. Rendered only when written —
                  the field ships empty and is filled in later, and an empty
                  paragraph would leave a gap in the card. */}
              {stage.overview ? (
                <p className="text-[15px] leading-relaxed text-foreground/90">
                  {stage.overview}
                </p>
              ) : null}

              {/* One line, from one field. The stage reference used to live in
                  `description` as prose and get rendered again from
                  `sharedWith`, so the same fact appeared twice in a row. */}
              {stage.sharedWith && stage.sharedWith.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Shared with{" "}
                  {stage.sharedWith
                    .map((ref) => {
                      const title = pathTitles?.[ref.slug] ?? ref.slug;
                      return ref.stages ? `${title}, ${ref.stages}` : title;
                    })
                    .join("; ")}
                  .
                </p>
              ) : null}

              {/*
                The wording is derived from the fields it describes, never
                stored or edited separately. Empty overview and empty
                definitions means "not yet written"; anything present means a
                draft is on the page.

                This is deliberate: the two were previously allowed to
                disagree, and the banner ended up asserting "not yet written"
                directly above ten written definitions. Reading the data is
                the only way it cannot drift again.
              */}
              {stage.needsOriginalContent ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-amber-400">
                    <PenLine className="size-4" aria-hidden />
                    {stage.overview.trim() ||
                    stage.topics.some((topic) => topic.definition.trim())
                      ? "Draft — to be rewritten from production experience"
                      : "Original content — not yet written"}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {stage.note}
                  </p>
                </div>
              ) : null}

              {stage.topics.length > 0 ? (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    What this covers
                  </h4>

                  <ul className="mt-3 space-y-4">
                    {stage.topics.map((topic) => (
                      <li
                        key={topic.term}
                        className="border-l-2 border-border/60 pl-4"
                      >
                        <h5 className="text-sm font-medium">{topic.term}</h5>

                        {topic.definition ? (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {topic.definition}
                          </p>
                        ) : null}

                        <ResourceList
                          resources={topic.resources}
                          className="mt-2"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {stage.resources.length > 0 ? (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {/* Named apart from the per-topic links, which sit above.
                        These are whole-stage recommendations: courses, vendor
                        certifications, video series. */}
                    Courses and certifications
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
          </ScrollReveal>
        </li>
      ))}
    </ol>
  );
}
