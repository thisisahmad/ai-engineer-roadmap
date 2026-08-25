import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/**
 * Metadata routes compile to Route Handlers, which are dynamic by default.
 * `output: "export"` requires them to be explicitly static so the file can be
 * written to disk at build time.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
