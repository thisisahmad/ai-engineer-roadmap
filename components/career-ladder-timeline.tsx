"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Check, Sparkles } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { LadderLevel } from "@/lib/types";

/**
 * The career ladder as an interactive horizontal timeline.
 *
 * Deliberately 2D and high-contrast rather than WebGL: this page is read, not
 * admired, so the glow language from the hero is reproduced with CSS shadows
 * and gradients instead of a bloom pass.
 *
 * Every panel is rendered into the DOM and inactive ones are hidden, so all
 * five rungs stay crawlable.
 */

/**
 * A violet-to-amber ramp across the five rungs, with the switch landing at
 * Lead/Staff — the point the source doc describes scope crossing from one team
 * to many. The Level colours used elsewhere are not reused here: the ladder has
 * five rungs where Level has four values, and Senior and Lead/Staff share one.
 */
const RUNGS = [
  {
    dot: "bg-violet-600",
    text: "text-violet-300",
    border: "border-violet-500/50",
    bg: "bg-violet-500/10",
    glow: "shadow-[0_0_20px_-2px_rgba(124,58,237,0.75)]",
    marker: "bg-violet-600/20 text-violet-300",
  },
  {
    dot: "bg-violet-500",
    text: "text-violet-300",
    border: "border-violet-500/50",
    bg: "bg-violet-500/10",
    glow: "shadow-[0_0_20px_-2px_rgba(139,92,246,0.75)]",
    marker: "bg-violet-500/20 text-violet-300",
  },
  {
    dot: "bg-violet-400",
    text: "text-violet-200",
    border: "border-violet-400/50",
    bg: "bg-violet-400/10",
    glow: "shadow-[0_0_20px_-2px_rgba(167,139,250,0.75)]",
    marker: "bg-violet-400/20 text-violet-200",
  },
  {
    dot: "bg-amber-400",
    text: "text-amber-300",
    border: "border-amber-400/50",
    bg: "bg-amber-400/10",
    glow: "shadow-[0_0_20px_-2px_rgba(251,191,36,0.75)]",
    marker: "bg-amber-400/20 text-amber-300",
  },
  {
    dot: "bg-amber-300",
    text: "text-amber-200",
    border: "border-amber-300/50",
    bg: "bg-amber-300/10",
    glow: "shadow-[0_0_26px_-2px_rgba(252,211,77,0.85)]",
    marker: "bg-amber-300/20 text-amber-200",
  },
] as const;

function rung(index: number) {
  return RUNGS[Math.min(index, RUNGS.length - 1)];
}

export function CareerLadderTimeline({ levels }: { levels: LadderLevel[] }) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  const current = levels[active];

  return (
    <div>
      {/* ------------------------------------------------ timeline strip */}
      <Reveal>
        {/* Scrolls inside its own container on narrow screens rather than
            collapsing to a vertical list, so the progression keeps reading as
            a progression. */}
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <ol
            role="tablist"
            aria-label="Career levels"
            className="relative flex min-w-[42rem] items-start"
          >
            {/* Track, behind the markers at their centre line. */}
            <div
              className="absolute left-[10%] right-[10%] top-[26px] h-px bg-gradient-to-r from-violet-600/60 via-violet-400/60 to-amber-300/60"
              aria-hidden
            />

            {levels.map((level, i) => {
              const s = rung(i);
              const isActive = i === active;
              const isPast = i < active;

              return (
                <li key={level.id} className="relative flex-1">
                  <button
                    type="button"
                    role="tab"
                    id={`ladder-tab-${level.id}`}
                    aria-selected={isActive}
                    aria-controls={`ladder-panel-${level.id}`}
                    onClick={() => setActive(i)}
                    className="group flex w-full flex-col items-center gap-2.5 rounded-xl px-2 py-1.5 text-center transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex h-[52px] items-center justify-center">
                      <span
                        className={cn(
                          "relative flex size-6 items-center justify-center rounded-full border-2 border-background transition-all duration-300",
                          s.dot,
                          isActive
                            ? cn("scale-125", s.glow)
                            : "opacity-70 group-hover:opacity-100",
                        )}
                        aria-hidden
                      >
                        {isPast ? (
                          <Check className="size-3 text-background" />
                        ) : null}
                      </span>
                    </span>

                    <span
                      className={cn(
                        "font-mono text-[11px] transition-colors",
                        isActive ? s.text : "text-muted-foreground",
                      )}
                    >
                      {level.yearsExperience}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium leading-tight transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {level.title}
                    </span>
                    <span className="text-[11px] leading-tight text-muted-foreground/70">
                      {level.focus}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </Reveal>

      {/* ------------------------------------------------- detail panels */}
      <div className="mt-10">
        {levels.map((level, i) => {
          const s = rung(i);
          const isActive = i === active;

          return (
            <section
              key={level.id}
              id={`ladder-panel-${level.id}`}
              role="tabpanel"
              aria-labelledby={`ladder-tab-${level.id}`}
              hidden={!isActive}
            >
              <motion.div
                initial={false}
                animate={
                  reduced
                    ? { opacity: 1, y: 0 }
                    : { opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }
                }
                transition={{ duration: 0.28, ease: "easeOut" }}
                className={cn("rounded-2xl border p-6 sm:p-8", s.border, s.bg)}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {level.title}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[11px]",
                      s.marker,
                    )}
                  >
                    {level.yearsExperience}
                  </span>
                </div>

                <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Focus
                    </dt>
                    <dd className="mt-1.5 text-sm">{level.focus}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Scope
                    </dt>
                    <dd className="mt-1.5 text-sm">{level.scope}</dd>
                  </div>
                </dl>

                <p
                  className={cn(
                    "mt-6 border-l-2 pl-4 text-sm leading-relaxed text-muted-foreground",
                    s.border,
                  )}
                >
                  {level.guidance}
                </p>

                <div className="mt-8 grid gap-8 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight">
                      What changes at this level
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {level.responsibilities.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                        >
                          <span
                            className={cn(
                              "mt-1.5 size-1.5 shrink-0 rounded-full",
                              s.dot,
                            )}
                            aria-hidden
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
                      {i === 0 ? (
                        <>
                          <Sparkles className="size-3.5" aria-hidden />
                          What gets you in
                        </>
                      ) : (
                        <>
                          <ArrowDown className="size-3.5" aria-hidden />
                          What separates this from {levels[i - 1].title}
                        </>
                      )}
                    </h3>

                    {level.entryNote ? (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">
                        {level.entryNote}
                      </p>
                    ) : null}

                    <ul className="mt-3 space-y-2">
                      {level.separators.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                        >
                          <Check
                            className={cn("mt-0.5 size-3.5 shrink-0", s.text)}
                            aria-hidden
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </section>
          );
        })}
      </div>

      {/* Prev / next, so the panel can be walked without returning to the
          strip on a narrow screen. */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setActive((i) => Math.max(i - 1, 0))}
          disabled={active === 0}
          className="rounded-lg border border-border/60 px-3 py-1.5 text-xs transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous level
        </button>
        <p className="font-mono text-[11px] text-muted-foreground">
          {active + 1} / {levels.length}
        </p>
        <button
          type="button"
          onClick={() => setActive((i) => Math.min(i + 1, levels.length - 1))}
          disabled={active === levels.length - 1}
          className="rounded-lg border border-border/60 px-3 py-1.5 text-xs transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next level
        </button>
      </div>

      <p aria-live="polite" className="sr-only">
        Showing {current.title}, {current.yearsExperience}.
      </p>
    </div>
  );
}
