import "server-only";

import { createClient as createWebClient } from "@libsql/client/web";
import type { Client } from "@libsql/client/web";

/**
 * The libSQL connection.
 *
 * Imports `@libsql/client/web`, not `@libsql/client`.
 *
 * The default entry point depends on the `libsql` package, which loads a
 * native `.node` binary matched to the host platform. That binary is a
 * platform-specific optional dependency, so a build produced on one machine
 * and run on another — every serverless deploy — can end up without the one it
 * needs, and the import fails with MODULE_NOT_FOUND at runtime rather than at
 * build time. The `/web` entry speaks HTTP and WebSocket only and has no
 * native dependency at all, which is what a hosted Turso database needs
 * anyway.
 *
 * The cost is that `file:` URLs are not supported, since those are the one
 * case that genuinely needs the native driver. Development therefore points at
 * a Turso database too — a separate free one, not the production database.
 */

declare global {
  // Reused across hot reloads in dev, so watch mode does not open a new
  // connection on every file change.
  var __libsql: Client | undefined;
}

let client: Client | undefined;

function getClient(): Client {
  if (client) return client;
  if (globalThis.__libsql) return (client = globalThis.__libsql);

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set.\n\n" +
        "Set it and TURSO_AUTH_TOKEN in the Vercel project under " +
        "Settings -> Environment Variables, then redeploy. Locally, put both " +
        "in .env.local — see the README for creating a database.",
    );
  }

  if (url.startsWith("file:")) {
    throw new Error(
      `TURSO_DATABASE_URL is "${url}". This client speaks HTTP only, so a ` +
        "file: URL cannot work. Point it at a Turso database (libsql://...) " +
        "for development as well as production.",
    );
  }

  // A remote libSQL URL without a token authenticates as nobody and every
  // query fails at runtime. Better to say so on the first query.
  if (url.startsWith("libsql://") && !authToken) {
    throw new Error(
      "TURSO_DATABASE_URL is remote but TURSO_AUTH_TOKEN is missing.",
    );
  }

  client = createWebClient({ url, authToken });

  if (process.env.NODE_ENV !== "production") globalThis.__libsql = client;
  return client;
}

/**
 * Proxy so `db.execute(...)` reads as a normal client while construction stays
 * deferred to the first actual call.
 *
 * Deferring matters: `next build` evaluates these modules while prerendering,
 * and validating credentials at import would fail any build run without them
 * even though the prerender never issues a query.
 */
export const db: Client = new Proxy({} as Client, {
  get(_target, property, receiver) {
    const value = Reflect.get(getClient(), property, receiver);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});
