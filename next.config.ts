import type { NextConfig } from "next";

/**
 * Hybrid: mostly static, with a small dynamic surface for accounts.
 *
 * This site was a pure `output: "export"` static build. Adding sign-in and
 * per-user progress required a server, so the export is gone — a static bundle
 * has nowhere to run a Server Action or read a session cookie.
 *
 * Almost nothing else changes. Every content route still prerenders at build
 * time from /content and is served from Vercel's CDN. Only these are dynamic:
 *
 *   /sign-in, /sign-up, /account   session-dependent
 *   /paths/[slug]                  prerendered, then personalised on the client
 *   Server Actions                 auth and progress writes
 *
 * The database is Turso (hosted libSQL). Plain SQLite cannot work here: a
 * serverless filesystem is ephemeral and not shared between invocations, so a
 * .db file would be empty on one request and gone on the next.
 */
const nextConfig: NextConfig = {
  /*
   * Build output directory, overridable per invocation.
   *
   * `next build` and `next dev` both own `.next`, so running a build while a
   * dev server is up corrupts the running server's chunks — it surfaces as
   * "Cannot find module for page" or a missing webpack chunk, which looks like
   * a source error but is not. Set NEXT_DIST_DIR to verify a build without
   * disturbing a dev server:
   *
   *   NEXT_DIST_DIR=.next-verify npm run build
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // `output: "export"` removed — incompatible with Server Actions and cookies.
  // `images.unoptimized` removed with it, so next/image optimisation is back.

  // Kept from the static build so existing URLs and internal links are
  // unchanged. Dropping it now would 308 every indexed page.
  trailingSlash: true,

  // Fail the production build on type errors instead of shipping them.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  /*
   * `@libsql/client` was listed here as an external package, which left Next
   * to rely on file tracing to copy it into the deployment. The client now
   * imports `@libsql/client/web`, which is pure JavaScript with no native
   * binding, so it bundles cleanly and there is nothing to trace or miss.
   */
};

export default nextConfig;
