import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Resource } from "@/lib/types";

/**
 * Resources render as a plain link list.
 *
 * `Resource.source` ("team-lead" | "curated") is deliberately NOT shown. It is
 * kept in the JSON as internal provenance — useful when auditing where a link
 * came from — but it means nothing to a visitor, so it stays out of the UI.
 *
 * Hover is deliberately small. These are dense lists — a stage can carry
 * twenty links — so anything with lift, glow or scale turns the page into
 * noise on the way down it. Two cheap cues only: an underline that wipes in
 * from the left, and the arrow nudging the way it will send you.
 */
export function ResourceList({
  resources,
  className,
}: {
  resources: Resource[];
  className?: string;
}) {
  // Collapse repeats by URL. Stage resources arrive already deduped from the
  // loader, but projects and the resource library do not go through it, and
  // two entries for one URL would render as identical rows with a duplicate
  // React key. Deduping here makes that impossible for every caller.
  const unique = Array.from(
    new Map(resources.map((resource) => [resource.url, resource])).values(),
  );

  if (unique.length === 0) return null;

  return (
    <ul className={cn("grid gap-1 sm:grid-cols-2", className)}>
      {unique.map((resource) => (
        <li key={resource.url}>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/40"
          >
            <ArrowUpRight
              className={cn(
                "mt-0.5 size-3.5 shrink-0 text-muted-foreground/60",
                "transition-[transform,color] duration-200 ease-out",
                // Points where it sends you. Half a pixel of intent, no more.
                "group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-400",
                "group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:text-violet-400",
              )}
              aria-hidden
            />

            <span className="flex-1">
              <span
                className={cn(
                  // A background-image underline rather than a positioned
                  // element, because these labels wrap: an absolutely
                  // positioned bar only underlines the last line, while a
                  // background follows every line of the run.
                  "bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat pb-px",
                  "transition-[background-size] duration-300 ease-out",
                  "group-hover:bg-[length:100%_1px] group-focus-visible:bg-[length:100%_1px]",
                )}
              >
                {resource.label}
              </span>

              {resource.note ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {resource.note}
                </span>
              ) : null}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
