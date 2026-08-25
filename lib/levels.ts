import type { Level } from "@/lib/types";

/**
 * Single source of truth for level colour.
 *
 * The 3D roadmap graph and the 2D stage cards must agree, so both read from
 * here rather than each keeping their own map. `hex` feeds three.js materials;
 * the Tailwind class strings are written out in full because Tailwind cannot
 * see dynamically constructed class names.
 */
export type LevelStyle = {
  label: string;
  /** For three.js materials and any inline colour. */
  hex: string;
  /** Badge on the 2D stage card. */
  badge: string;
  /** Timeline marker ring. */
  marker: string;
  /** Solid fill, used by the mobile roadmap dots. */
  dot: string;
  /** Connector line on the mobile roadmap. */
  line: string;
};

export const LEVEL_STYLES: Record<Level, LevelStyle> = {
  junior: {
    label: "Junior",
    hex: "#34d399",
    badge: "border-emerald-500/40 text-emerald-400",
    marker: "border-emerald-500/60 text-emerald-400",
    dot: "bg-emerald-400",
    line: "bg-emerald-500/40",
  },
  mid: {
    label: "Mid",
    hex: "#38bdf8",
    badge: "border-sky-500/40 text-sky-400",
    marker: "border-sky-500/60 text-sky-400",
    dot: "bg-sky-400",
    line: "bg-sky-500/40",
  },
  senior: {
    label: "Senior",
    hex: "#a78bfa",
    badge: "border-violet-500/40 text-violet-400",
    marker: "border-violet-500/60 text-violet-400",
    dot: "bg-violet-400",
    line: "bg-violet-500/40",
  },
  architect: {
    label: "Architect",
    hex: "#fbbf24",
    badge: "border-amber-500/40 text-amber-400",
    marker: "border-amber-500/60 text-amber-400",
    dot: "bg-amber-400",
    line: "bg-amber-500/40",
  },
};

/** Rank drives node size and glow — junior smallest and dimmest. */
export const LEVEL_RANK: Record<Level, number> = {
  junior: 0,
  mid: 1,
  senior: 2,
  architect: 3,
};

/** Shared id so a graph node can scroll to its card in the stage list. */
export function stageAnchorId(stageId: string): string {
  return `stage-${stageId}`;
}
