"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { accent } from "@/lib/accents";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/lib/chat/types";

/**
 * A recommendation rendered inline in the conversation.
 *
 * Follows the homepage path card — accent border, glow wash, arrow that moves
 * on hover — at a smaller scale, because these sit inside a message rather
 * than in a grid. Like those cards it is one real anchor rather than a
 * stretched pseudo-element, so the whole surface is tappable.
 *
 * Only ever rendered from a server-validated recommendation, so the slug and
 * URL are known to exist.
 */
export function RecommendationCard({ item }: { item: Recommendation }) {
  if (item.type === "resource") {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group my-3 block rounded-xl border border-border/60 bg-card/50 p-4",
          "transition-colors hover:border-violet-500/40 hover:bg-card/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Resource
            </p>
            <p className="mt-1 font-medium leading-snug">{item.title}</p>
          </div>
          <ArrowUpRight
            className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-[transform,color] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-400"
            aria-hidden
          />
        </div>

        {item.reason ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {item.reason}
          </p>
        ) : null}
      </a>
    );
  }

  const a = accent(item.accent);

  return (
    <Link
      href={`/paths/${item.slug}/`}
      className={cn(
        "group my-3 block overflow-hidden rounded-xl border bg-card/50 p-4",
        "border-border/60 transition-all hover:-translate-y-0.5 hover:bg-card/80",
        a.hoverBorder,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
      )}
    >
      <div className="relative">
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 -top-10 -z-10 h-20 bg-gradient-to-b to-transparent opacity-50 blur-2xl transition-opacity group-hover:opacity-100",
            a.glow,
          )}
          aria-hidden
        />

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", a.dot)} aria-hidden />
          Career path
        </p>

        <p className="mt-1.5 font-medium leading-snug">{item.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {item.tagline}
        </p>

        {item.reason ? (
          <p className="mt-2 border-l-2 border-border/60 pl-3 text-sm leading-relaxed">
            {item.reason}
          </p>
        ) : null}

        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-sm font-medium",
            a.text,
          )}
        >
          {item.stageCount} stages
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </p>
      </div>
    </Link>
  );
}
