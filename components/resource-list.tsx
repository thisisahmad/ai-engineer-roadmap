import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Resource } from "@/lib/types";

/**
 * Resources render as a plain link list.
 *
 * `Resource.source` ("team-lead" | "curated") is deliberately NOT shown. It is
 * kept in the JSON as internal provenance — useful when auditing where a link
 * came from — but it means nothing to a visitor, so it stays out of the UI.
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
            className="group flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-white/5"
          >
            <ExternalLink
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground"
              aria-hidden
            />
            <span className="flex-1">
              <span className="underline-offset-4 group-hover:underline">
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
