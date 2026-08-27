import "server-only";

import { createClient, type Client } from "@libsql/client";

/**
 * The libSQL connection.
 *
 * Turso speaks SQLite over HTTP, so the same client and the same SQL work
 * against a hosted database in production and a plain file in development —
 * which is what lets this run on Vercel at all. A normal SQLite file cannot,
 * because serverless filesystems are ephemeral and not shared between
 * invocations.
 *
 * Local dev needs no account: leave the env vars unset and it falls back to
 * `file:./local.db`.
 *
 * Connection setup is deferred to the first query, not done at import. `next
 * build` runs with NODE_ENV=production, so validating eagerly would fail any
 * build performed without database credentials to hand — even though the
 * prerender never issues a query. Pages that touch the database are dynamic
 * and only ever run with real request env.
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
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "TURSO_DATABASE_URL is not set. Production must point at a real database — " +
          "a local file would be wiped on every deploy.",
      );
    }
    client = createClient({ url: "file:./local.db" });
  } else {
    // A remote libSQL URL without a token authenticates as nobody and every
    // query fails at runtime. Better to say so on the first query.
    if (url.startsWith("libsql://") && !authToken) {
      throw new Error(
        "TURSO_DATABASE_URL is remote but TURSO_AUTH_TOKEN is missing.",
      );
    }
    client = createClient({ url, authToken });
  }

  if (process.env.NODE_ENV !== "production") globalThis.__libsql = client;
  return client;
}

/**
 * Proxy so `db.execute(...)` reads as a normal client while construction stays
 * deferred to the first actual call.
 */
export const db: Client = new Proxy({} as Client, {
  get(_target, property, receiver) {
    const value = Reflect.get(getClient(), property, receiver);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});
