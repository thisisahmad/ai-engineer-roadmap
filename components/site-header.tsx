import Link from "next/link";
import { Route } from "lucide-react";

import { SiteNav } from "@/components/site-nav";
import { getPathSummaries } from "@/lib/content";
import { brand } from "@/lib/site";

/**
 * Server component: reads the paths at build time and hands them to the
 * client nav. Keeps the content loader out of the client bundle, and means
 * the dropdown never goes stale when a path file is added.
 */
export function SiteHeader() {
  const paths = getPathSummaries().map((path) => ({
    slug: path.slug,
    title: path.title,
    shortTitle: path.shortTitle,
    tagline: path.tagline,
    accent: path.accent,
    flagship: path.flagship,
  }));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <Route className="size-5 text-violet-500" aria-hidden />
          <span>{brand.name}</span>
        </Link>

        <SiteNav paths={paths} />
      </div>
    </header>
  );
}
