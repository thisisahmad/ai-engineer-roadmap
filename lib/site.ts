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
