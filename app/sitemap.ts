import type { MetadataRoute } from "next";

import { getAllPathSlugs } from "@/lib/content";
import { siteUrl } from "@/lib/site";

/**
 * Metadata routes compile to Route Handlers, which are dynamic by default.
 * `output: "export"` requires them to be explicitly static so the file can be
 * written to disk at build time.
 */
export const dynamic = "force-static";

/**
 * Emitted as a static /sitemap.xml during `next build`, so it works under
 * `output: "export"`. Set NEXT_PUBLIC_SITE_URL in Vercel to your production
 * domain — without it the URLs fall back to the deployment host.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: "/", priority: 1 },
    { path: "/compare/", priority: 0.9 },
    { path: "/foundation/", priority: 0.9 },
    { path: "/quiz/", priority: 0.8 },
    { path: "/career-ladder/", priority: 0.8 },
    { path: "/resources/", priority: 0.8 },
    { path: "/certifications/", priority: 0.7 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route.path}`,
      changeFrequency: "monthly" as const,
      priority: route.priority,
    })),
    ...getAllPathSlugs().map((slug) => ({
      url: `${siteUrl}/paths/${slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
