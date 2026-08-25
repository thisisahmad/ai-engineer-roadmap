import type { NextConfig } from "next";

/**
 * The whole site is statically generated — every route is prerendered at build
 * time from files in /content, so there is no server, no database and no
 * runtime cost. That keeps it comfortably inside Vercel's free tier.
 *
 * `output: "export"` emits a plain /out folder of HTML+assets. Vercel serves it
 * straight from the CDN, and the same folder works on any static host.
 *
 * If you ever need ISR, Route Handlers, `next/image` optimization or Middleware,
 * delete the `output` and `images` lines below. Everything else keeps working —
 * Vercel will still prerender these pages at build time and serve them from the
 * CDN, you just stop being portable to non-Vercel static hosts.
 */
const nextConfig: NextConfig = {
  output: "export",

  // The Vercel Image Optimization API is a server feature, so it cannot run in
  // a static export. Images are served as-authored instead.
  images: { unoptimized: true },

  // Emit /paths/agents/index.html rather than /paths/agents.html, so static
  // hosts resolve nested routes without extra rewrite rules.
  trailingSlash: true,

  // Fail the production build on type errors instead of shipping them.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
