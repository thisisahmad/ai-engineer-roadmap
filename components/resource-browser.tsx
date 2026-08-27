"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CostTier, LibraryResource, ResourceCategory } from "@/lib/types";

/**
 * Filterable resource library.
 *
 * Every item is rendered on every pass and non-matches are hidden with an
 * inline `display: none` rather than being removed from the array. That keeps
 * the whole library in the prerendered HTML — this is a client component, but
 * Next still renders it to static markup at build time, so the list is fully
 * crawlable and filtering is pure presentation on top.
 *
 * Inline style rather than a `hidden` class or attribute: Tailwind Preflight
 * scopes `[hidden]` inside `:where()`, so any display utility on the same
 * element would win.
 */

const COST_STYLE: Record<CostTier, { label: string; className: string }> = {
  free: {
    label: "Free",
    className: "border-emerald-500/40 text-emerald-400",
  },
  "free-audit": {
    label: "Free · paid cert",
    className: "border-amber-500/40 text-amber-400",
  },
  paid: {
    label: "Paid",
    className: "border-border text-muted-foreground",
  },
};

type PathOption = { slug: string; label: string };

export function ResourceBrowser({
  items,
  categories,
  pathOptions,
}: {
  items: LibraryResource[];
  categories: ResourceCategory[];
  pathOptions: PathOption[];
}) {
  const [path, setPath] = useState<string>("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();

  const matches = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const item of items) {
      const byPath = path === "all" || item.paths.includes(path);
      const byCost = !freeOnly || item.cost === "free";
      const byQuery =
        needle.length === 0 ||
        item.label.toLowerCase().includes(needle) ||
        item.provider.toLowerCase().includes(needle);
      map.set(item.id, byPath && byCost && byQuery);
    }
    return map;
  }, [items, path, freeOnly, needle]);

  const total = useMemo(
    () => [...matches.values()].filter(Boolean).length,
    [matches],
  );

  /** Per-path counts, so a filter that would empty the list reads as empty
   *  before it is clicked. */
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    map.set("all", items.length);
    for (const option of pathOptions) {
      map.set(
        option.slug,
        items.filter((item) => item.paths.includes(option.slug)).length,
      );
    }
    return map;
  }, [items, pathOptions]);

  const isFiltered = path !== "all" || freeOnly || needle.length > 0;

  return (
    <div>
      {/* ------------------------------------------------------- controls */}
      <div className="space-y-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or provider"
            aria-label="Search resources"
            className="w-full rounded-xl border border-border/60 bg-card/40 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-violet-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="sr-only" id="path-filter-label">
            Filter by path
          </span>
          <div
            role="group"
            aria-labelledby="path-filter-label"
            className="flex flex-wrap gap-2"
          >
            {[{ slug: "all", label: "All" }, ...pathOptions].map((option) => {
              const isActive = path === option.slug;
              const count = counts.get(option.slug) ?? 0;

              return (
                <button
                  key={option.slug}
                  type="button"
                  onClick={() => setPath(option.slug)}
                  aria-pressed={isActive}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    isActive
                      ? "border-violet-500/60 bg-violet-500/15 text-violet-200"
                      : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  {option.label}
                  <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setFreeOnly((value) => !value)}
            aria-pressed={freeOnly}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              freeOnly
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            Fully free only
          </button>

          <div className="flex items-center gap-3">
            <p aria-live="polite" className="text-xs text-muted-foreground">
              {total} of {items.length} resources
            </p>
            {isFiltered ? (
              <button
                type="button"
                onClick={() => {
                  setPath("all");
                  setFreeOnly(false);
                  setQuery("");
                }}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3" aria-hidden />
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- list */}
      <div className="mt-10 space-y-12">
        {categories.map((category) => {
          const inCategory = items.filter(
            (item) => item.category === category.id,
          );
          const visible = inCategory.filter((item) => matches.get(item.id));

          return (
            <section
              key={category.id}
              aria-labelledby={`category-${category.id}`}
              // Whole section drops out when the filter empties it.
              style={{ display: visible.length === 0 ? "none" : undefined }}
            >
              <h2
                id={`category-${category.id}`}
                className="font-semibold text-sm font-medium uppercase tracking-wide text-muted-foreground"
              >
                {category.label}
                <span className="ml-2 tabular-nums opacity-60">
                  {visible.length}
                </span>
              </h2>

              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {inCategory.map((item) => {
                  const cost = COST_STYLE[item.cost];

                  return (
                    <li
                      key={item.id}
                      style={{
                        display: matches.get(item.id) ? undefined : "none",
                      }}
                    >
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex h-full flex-col rounded-xl border border-border/60 bg-card/30 p-4 transition-all hover:-translate-y-0.5 hover:border-violet-500/40 hover:bg-card/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-medium leading-tight underline-offset-4 group-hover:underline">
                            {item.label}
                          </h3>
                          <ExternalLink
                            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground"
                            aria-hidden
                          />
                        </div>

                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {item.provider}
                        </p>

                        {item.note ? (
                          <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground/80">
                            {item.note}
                          </p>
                        ) : (
                          <span className="flex-1" />
                        )}

                        <span
                          className={cn(
                            "mt-3 w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            cost.className,
                          )}
                        >
                          {cost.label}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        {total === 0 ? (
          <p className="rounded-xl border border-border/60 py-12 text-center text-sm text-muted-foreground">
            Nothing matches those filters.
          </p>
        ) : null}
      </div>
    </div>
  );
}
