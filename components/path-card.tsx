import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { accent } from "@/lib/accents";
import { cn } from "@/lib/utils";
import type { Path } from "@/lib/types";

/**
 * A career path on the landing page. The whole card is one link — the
 * pseudo-element overlay keeps it clickable everywhere while exposing exactly
 * one link to assistive technology.
 *
 * Wrapped in React Bits' SpotlightCard, restyled: the upstream default is a
 * white spotlight on a fixed neutral-900 panel, which ignored the palette.
 * Each card now casts its own path accent, so the grid reads as seven
 * different routes rather than one repeated tile.
 */
export function PathCard({
  path,
  stageCount,
  resourceCount,
  firstStages,
}: {
  path: Omit<Path, "stages">;
  stageCount: number;
  resourceCount: number;
  firstStages: string[];
}) {
  const a = accent(path.accent);

  return (
    /*
     * The whole card is one real anchor, not a stretched `::after` on the
     * title. The pseudo-element version only made the title clickable when any
     * ancestor between it and the card was positioned, and it proved fragile
     * in combination with the card's overflow and transforms. An actual
     * element wrapping the content has no such conditions: clicking anywhere
     * inside it is clicking the link, and there is exactly one link per card
     * for assistive technology.
     */
    <Link
      href={`/paths/${path.slug}/`}
      className={cn(
        "group block h-full rounded-2xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <SpotlightCard
        spotlightColor={a.spotlight}
        className={cn(
          "isolate flex h-full flex-col rounded-2xl border bg-card/40 p-6 backdrop-blur-sm",
          "transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-card/70 group-hover:shadow-2xl group-hover:shadow-black/40",
          "border-border/60",
          a.hoverBorder.replace("hover:", "group-hover:"),
        )}
      >
        {/* Accent wash, brightening on hover. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 -top-24 -z-10 h-48 bg-gradient-to-b to-transparent opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
            a.glow,
          )}
          aria-hidden
        />

        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium",
              a.border,
              a.bg,
              a.text,
            )}
          >
            <span className={cn("size-1.5 rounded-full", a.dot)} aria-hidden />
            Path {path.pathLetter}
          </span>

          {path.flagship ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-400">
              <Star className="size-3 fill-current" aria-hidden />
              Flagship
            </span>
          ) : null}
        </div>

        {/* Plain text: the card itself is the link, and an anchor inside an
          anchor is invalid HTML. */}
        <h3 className="mt-5 text-xl font-semibold tracking-tight">
          {path.title}
        </h3>

        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          {path.tagline}
        </p>

        {/* A concrete preview of the first stages, so the card shows what the
          path actually contains rather than only how big it is. */}
        <ul className="mt-5 space-y-2">
          {firstStages.map((title, i) => (
            <li
              key={title}
              className="flex items-start gap-2.5 text-xs text-muted-foreground"
            >
              <span
                className={cn(
                  "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold tabular-nums",
                  a.border,
                  a.text,
                )}
                aria-hidden
              >
                {i + 1}
              </span>
              <span className="truncate">{title}</span>
            </li>
          ))}
          <li className="pl-[26px] text-xs text-muted-foreground/60">
            + {stageCount - firstStages.length} more stages
          </li>
        </ul>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-4">
          <dl className="flex gap-4 text-xs">
            <div>
              <dt className="sr-only">Stages</dt>
              <dd className="font-medium tabular-nums">{stageCount}</dd>
              <dd className="text-muted-foreground">stages</dd>
            </div>
            <div>
              <dt className="sr-only">Resources</dt>
              <dd className="font-medium tabular-nums">{resourceCount}</dd>
              <dd className="text-muted-foreground">resources</dd>
            </div>
          </dl>

          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium",
              a.text,
            )}
          >
            Open
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </span>
        </div>
      </SpotlightCard>
    </Link>
  );
}
