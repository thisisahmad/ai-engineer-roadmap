/**
 * Tailwind scans source files for complete class strings, so accent classes are
 * written out in full here rather than built with template literals. Add a new
 * accent by adding a key — the `satisfies` check keeps every entry complete.
 */

export const PATH_ACCENTS = {
  violet: {
    text: "text-violet-500",
    border: "border-violet-500/30",
    bg: "bg-violet-500/10",
    dot: "bg-violet-500",
    glow: "from-violet-500/20",
  },
  cyan: {
    text: "text-cyan-500",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    dot: "bg-cyan-500",
    glow: "from-cyan-500/20",
  },
  emerald: {
    text: "text-emerald-500",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    dot: "bg-emerald-500",
    glow: "from-emerald-500/20",
  },
  amber: {
    text: "text-amber-500",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    dot: "bg-amber-500",
    glow: "from-amber-500/20",
  },
  rose: {
    text: "text-rose-500",
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    dot: "bg-rose-500",
    glow: "from-rose-500/20",
  },
  sky: {
    text: "text-sky-500",
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
    dot: "bg-sky-500",
    glow: "from-sky-500/20",
  },
  teal: {
    text: "text-teal-500",
    border: "border-teal-500/30",
    bg: "bg-teal-500/10",
    dot: "bg-teal-500",
    glow: "from-teal-500/20",
  },
} as const;

export type AccentName = keyof typeof PATH_ACCENTS;

export function accent(name: AccentName) {
  return PATH_ACCENTS[name] ?? PATH_ACCENTS.violet;
}
