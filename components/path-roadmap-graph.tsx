"use client";

import { useEffect, useRef, useState } from "react";

import { LEVEL_STYLES, stageAnchorId } from "@/lib/levels";
import { countStageResources } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { Level, Path, Stage } from "@/lib/types";

/**
 * Path overview: a glass rail of stages along an illuminated connector.
 *
 * This replaced a WebGL scene. That version put stage 1 off the left edge,
 * collided its own labels with its nodes, and drew big flat discs that read as
 * a diagram rather than a surface — and it cost a second GL context on top of
 * the hero. Glass is a 2D material: translucency, blur, a specular edge and a
 * moving highlight are what sell it, and CSS does all four natively.
 *
 * One layout at every width. Cards have a fixed width and the rail scrolls
 * horizontally when they do not fit, so nothing overlaps and nothing clips.
 */

const RESOURCE_NOUN = (count: number) =>
  count === 1 ? "resource" : "resources";

function scrollToStage(stageId: string) {
  const target = document.getElementById(stageAnchorId(stageId));
  if (!target) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
}

function StageNode({
  stage,
  index,
  visible,
  reduced,
}: {
  stage: Stage;
  index: number;
  visible: boolean;
  reduced: boolean;
}) {
  const style = LEVEL_STYLES[stage.level];
  const resources = countStageResources(stage);

  return (
    <button
      type="button"
      onClick={() => scrollToStage(stage.id)}
      style={{
        // Staggered entrance, left to right, so the rail assembles along its
        // own direction of travel.
        transitionDelay: reduced ? "0ms" : `${Math.min(index, 12) * 55}ms`,
      }}
      className={cn(
        "group relative flex w-[10.5rem] shrink-0 snap-start flex-col gap-2 rounded-2xl p-3.5 text-left sm:w-[11.5rem]",
        // The glass itself: a translucent pane, blurred backdrop, and a light
        // top edge over a dark bottom one, which is what gives it thickness.
        "border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_24px_-12px_rgba(0,0,0,0.9)]",
        "transition-all duration-500 ease-out",
        "hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      {/* Level tint, held well below the text so contrast never drops. */}
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-40 transition-opacity duration-500 group-hover:opacity-90"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, ${style.hex}22, transparent 70%)`,
        }}
        aria-hidden
      />

      {/* Specular sweep. Clipped to the card, runs on hover only — a rail of
          ten cards all glinting at once would be noise. */}
      {!reduced ? (
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
          aria-hidden
        >
          <span className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/[0.13] to-transparent opacity-0 group-hover:opacity-100 group-hover:[animation:glass-sheen_1.1s_ease-out]" />
        </span>
      ) : null}

      <span className="relative flex items-center gap-2">
        <span
          className="flex size-6 items-center justify-center rounded-full border text-[10px] font-semibold tabular-nums"
          style={{
            borderColor: `${style.hex}55`,
            background: `${style.hex}1a`,
            color: style.hex,
          }}
          aria-hidden
        >
          {stage.order}
        </span>
        <span
          className="font-mono text-[10px] uppercase tracking-wider"
          style={{ color: style.hex }}
        >
          {style.label}
        </span>
      </span>

      <span className="relative text-[13px] font-medium leading-snug text-foreground/95">
        {stage.title}
      </span>

      <span className="relative text-[11px] text-muted-foreground">
        {stage.needsOriginalContent
          ? "Original content to write"
          : resources > 0
            ? `${resources} ${RESOURCE_NOUN(resources)}`
            : " "}
      </span>
    </button>
  );
}

export function PathRoadmapGraph({ path }: { path: Path }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Entrance runs once, when the rail is actually on screen.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.15 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <figure
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-3xl",
        "border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_60px_-40px_rgba(0,0,0,1)]",
      )}
    >
      {/* Ambient wash behind the glass, so the pane has something to refract. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(80% 120% at 15% 0%, color-mix(in oklch, var(--color-violet-500) 12%, transparent), transparent 60%), radial-gradient(70% 110% at 90% 100%, color-mix(in oklch, var(--color-amber-500) 9%, transparent), transparent 60%)",
        }}
        aria-hidden
      />

      <figcaption className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <h2 className="text-sm font-medium">Roadmap overview</h2>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {(Object.keys(LEVEL_STYLES) as Level[]).map((level) => (
            <li
              key={level}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <span
                className="size-1.5 rounded-full"
                style={{
                  background: LEVEL_STYLES[level].hex,
                  boxShadow: `0 0 8px ${LEVEL_STYLES[level].hex}`,
                }}
                aria-hidden
              />
              {LEVEL_STYLES[level].label}
            </li>
          ))}
        </ul>
      </figcaption>

      <div className="relative px-5 py-6">
        {/* Signals that the rail continues. Sits above the cards but ignores
            pointer events, so it never blocks a click on the last one. */}
        <div
          className="pointer-events-none absolute inset-y-6 right-0 z-10 w-12 bg-gradient-to-l from-background/80 to-transparent"
          aria-hidden
        />
        {/* Horizontal scroll rather than shrinking cards. Ten stages cannot
            fit a phone, and squeezing them is what clipped stage 1 before. */}
        <ol className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {path.stages.map((stage, index) => (
            <li key={stage.id} className="relative flex">
              {/* Connector segment, drawn only in the gap between two cards.
                  A single line behind the row showed through the glass and
                  crossed the titles, which read as a mistake rather than a
                  link. It grows with its card so the rail assembles. */}
              {index > 0 ? (
                <span
                  className="pointer-events-none absolute -left-3 top-[1.625rem] h-px w-3 origin-left transition-transform duration-500 ease-out"
                  style={{
                    background: `linear-gradient(90deg, ${LEVEL_STYLES[path.stages[index - 1].level].hex}, ${LEVEL_STYLES[stage.level].hex})`,
                    transform: visible ? "scaleX(1)" : "scaleX(0)",
                    transitionDelay: reduced ? "0ms" : `${Math.min(index, 12) * 55}ms`,
                  }}
                  aria-hidden
                />
              ) : null}

              <StageNode
                stage={stage}
                index={index}
                visible={visible}
                reduced={reduced}
              />
            </li>
          ))}
        </ol>
      </div>

      <p className="relative border-t border-white/[0.06] px-5 py-3 text-xs text-muted-foreground">
        Click any stage to jump to it below.
      </p>
    </figure>
  );
}
