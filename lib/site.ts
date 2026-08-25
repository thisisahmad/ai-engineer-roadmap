/**
 * The canonical origin for absolute URLs in metadata, the sitemap and robots.txt.
 *
 * Set NEXT_PUBLIC_SITE_URL in the Vercel project to your production domain.
 * Preview deployments fall back to the per-deployment host that Vercel injects,
 * and local builds fall back to localhost.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

/** Brand strings, in one place so the header, footer and metadata agree. */
export const brand = {
  name: "AI Roadmap",
  tagline: "Seven routes into AI engineering, stage by stage.",
  description:
    "Career roadmaps for AI engineering, merged from a working team roadmap and current industry research. Free resources wherever free exists.",
  /** Shown in the footer. Replace with your own. */
  author: "thisisahmad",
  authorUrl: "https://github.com/thisisahmad",
};

/**
 * The header call to action.
 *
 * PLACEHOLDER — the cohort/mentorship offering is not defined yet, so this
 * points at the path picker rather than inventing a destination. Change the
 * three fields here and both the desktop and mobile nav follow; nothing else
 * references them.
 *
 * Set `enabled: false` to drop the button entirely until the offering exists.
 */
export const siteCta = {
  enabled: true,
  label: "Find your path",
  href: "/#paths",
  /** Set true when this becomes an external signup link. */
  external: false,
};

/** Primary nav, excluding the Paths dropdown which is built from content. */
export const primaryNav = [
  { href: "/foundation/", label: "Foundation", match: "/foundation" },
  { href: "/compare/", label: "Compare roles", match: "/compare" },
  { href: "/career-ladder/", label: "Career ladder", match: "/career-ladder" },
  { href: "/resources/", label: "Resources", match: "/resources" },
  {
    href: "/certifications/",
    label: "Certifications",
    match: "/certifications",
  },
];
