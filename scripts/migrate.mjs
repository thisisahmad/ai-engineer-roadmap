/**
 * Applies lib/db/schema.sql to the configured database.
 *
 *   npm run db:migrate
 *
 * Every statement in the schema is idempotent, so this is safe to re-run and
 * safe to wire into a deploy step. Reads the same env vars as the app: with
 * none set it targets ./local.db, which is what you want in development.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { createClient } from "@libsql/client";

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(here, "..", "lib", "db", "schema.sql"), "utf8");

const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

if (url.startsWith("libsql://") && !authToken) {
  console.error("TURSO_DATABASE_URL is remote but TURSO_AUTH_TOKEN is missing.");
  process.exit(1);
}

const db = createClient({ url, authToken });

// Split on semicolons at end of line, ignoring the comment-only chunks that
// leaves behind. The schema deliberately contains no semicolons inside string
// literals, which is what makes this safe.
const statements = schema
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter((s) => s && !s.split("\n").every((line) => line.trim().startsWith("--")));

console.log(`applying ${statements.length} statements to ${url}`);

for (const statement of statements) {
  const label = statement.split("\n")[0].slice(0, 68);
  try {
    await db.execute(statement);
    console.log("  ok   " + label);
  } catch (error) {
    console.error("  FAIL " + label);
    console.error("       " + error.message);
    process.exit(1);
  }
}

const tables = await db.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
);
console.log("\ntables: " + tables.rows.map((r) => r.name).join(", "));
console.log("migration complete");
