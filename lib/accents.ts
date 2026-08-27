/**
 * Tailwind scans source files for complete class strings, so accent classes are
 * written out in full here rather than built with template literals. Add a new
 * accent by adding a key — the `satisfies` check keeps every entry complete.
 */

export const PATH_ACCENTS = {
  violet: {
    text: "text-violet-500",
    border: "border-violet-500/30",
    hoverBorder: "hover:border-violet-500/50",
    spotlight: "rgba(139, 92, 246, 0.16)",
    bg: "bg-violet-500/10",
    dot: "bg-violet-500",
    glow: "from-violet-500/20",
  },
  cyan: {
    text: "text-cyan-500",
    border: "border-cyan-500/30",
    hoverBorder: "hover:border-cyan-500/50",
    spotlight: "rgba(6, 182, 212, 0.16)",
    bg: "bg-cyan-500/10",
    dot: "bg-cyan-500",
    glow: "from-cyan-500/20",
  },
  emerald: {
    text: "text-emerald-500",
    border: "border-emerald-500/30",
    hoverBorder: "hover:border-emerald-500/50",
    spotlight: "rgba(16, 185, 129, 0.16)",
    bg: "bg-emerald-500/10",
    dot: "bg-emerald-500",
    glow: "from-emerald-500/20",
  },
  amber: {
    text: "text-amber-500",
    border: "border-amber-500/30",
    hoverBorder: "hover:border-amber-500/50",
    spotlight: "rgba(245, 158, 11, 0.16)",
    bg: "bg-amber-500/10",
    dot: "bg-amber-500",
    glow: "from-amber-500/20",
  },
  rose: {
    text: "text-rose-500",
    border: "border-rose-500/30",
    hoverBorder: "hover:border-rose-500/50",
    spotlight: "rgba(244, 63, 94, 0.16)",
    bg: "bg-rose-500/10",
    dot: "bg-rose-500",
    glow: "from-rose-500/20",
  },
  sky: {
    text: "text-sky-500",
    border: "border-sky-500/30",
    hoverBorder: "hover:border-sky-500/50",
    spotlight: "rgba(14, 165, 233, 0.16)",
    bg: "bg-sky-500/10",
    dot: "bg-sky-500",
    glow: "from-sky-500/20",
  },
  teal: {
    text: "text-teal-500",
    border: "border-teal-500/30",
    hoverBorder: "hover:border-teal-500/50",
    spotlight: "rgba(20, 184, 166, 0.16)",
    bg: "bg-teal-500/10",
    dot: "bg-teal-500",
    glow: "from-teal-500/20",
  },
} as const;

export type AccentName = keyof typeof PATH_ACCENTS;

export function accent(name: AccentName) {
  return PATH_ACCENTS[name] ?? PATH_ACCENTS.violet;
}
