"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { WebGLBoundary, hasWebGL } from "@/components/three/webgl-boundary";
import { LEVEL_STYLES, stageAnchorId } from "@/lib/levels";
import { cn } from "@/lib/utils";
import type { Path } from "@/lib/types";

/**
 * Path overview graph.
 *
 * Desktop gets the 3D scene; small screens get a plain 2D vertical version
 * with identical colour coding and the same scroll-to behaviour. This is a
 * secondary visual, so it is never worth pulling three.js onto a phone for.
 */
const PathRoadmapScene = dynamic(
  () => import("@/components/three/path-roadmap-scene"),
  { ssr: false, loading: () => null },
);

function scrollToStage(stageId: string) {
  const target = document.getElementById(stageAnchorId(stageId));
  if (!target) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
}

/** Mobile and no-WebGL fallback. No three.js, same colours, same targets. */
function VerticalRoadmap({ path }: { path: Path }) {
  return (
    <ol className="relative space-y-1">
      {path.stages.map((stage, i) => {
        const style = LEVEL_STYLES[stage.level];
        const isLast = i === path.stages.length - 1;

        return (
          <li key={stage.id} className="relative flex gap-3 pb-1">
            <div className="flex flex-col items-center">
              <span
                className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", style.dot)}
                aria-hidden
              />
              {!isLast ? (
                <span
                  className={cn("mt-1 w-px flex-1", style.line)}
                  aria-hidden
                />
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => scrollToStage(stage.id)}
              className="flex-1 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-white/5"
            >
              <span className="text-sm font-medium">{stage.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {stage.levelLabel}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function PathRoadmapGraph({ path }: { path: Path }) {
  const [use3D, setUse3D] = useState(false);
  const [bloom, setBloom] = useState(true);

  useEffect(() => {
    if (!hasWebGL()) return;

    const desktop = window.matchMedia("(min-width: 1024px)");

    type Nav = Navigator & { deviceMemory?: number };
    const nav = navigator as Nav;
    const lowPower =
      (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) ||
      (typeof nav.hardwareConcurrency === "number" &&
        nav.hardwareConcurrency > 0 &&
        nav.hardwareConcurrency <= 4);

    const sync = () => {
      setUse3D(desktop.matches);
      setBloom(!lowPower);
    };

    sync();
    desktop.addEventListener("change", sync);
    return () => desktop.removeEventListener("change", sync);
  }, []);

  return (
    <section
      aria-label={`${path.title} roadmap overview`}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-5 py-3">
        <h2 className="text-sm font-medium">Roadmap overview</h2>

        {/* Legend doubles as the key for both the 3D and 2D versions. */}
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {(["junior", "mid", "senior", "architect"] as const).map((level) => (
            <li
              key={level}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <span
                className={cn("size-2 rounded-full", LEVEL_STYLES[level].dot)}
                aria-hidden
              />
              {LEVEL_STYLES[level].label}
            </li>
          ))}
        </ul>
      </div>

      {/* Height is reserved at the lg breakpoint whichever version renders.
          The 2D list is server-rendered and swaps to the canvas after mount,
          so without a fixed box that swap would shift the page. Below lg the
          box is auto-height and the list is the real content. */}
      <div className="lg:h-[340px]">
        {use3D ? (
          <div className="h-full w-full">
            <WebGLBoundary>
              <PathRoadmapScene stages={path.stages} bloom={bloom} />
            </WebGLBoundary>
          </div>
        ) : (
          <div className="px-5 py-4 lg:h-full lg:overflow-y-auto">
            <VerticalRoadmap path={path} />
          </div>
        )}
      </div>

      {/* Always rendered, so the hint line cannot shift the page either. */}
      <p className="border-t border-border/50 px-5 py-2.5 text-[11px] text-muted-foreground">
        {use3D
          ? "Hover a node for its stage, click to jump to it below."
          : "Tap a stage to jump to it below."}
      </p>
    </section>
  );
}
