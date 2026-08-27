/**
 * Applies lib/db/schema.sql to the configured database.
 *
 *   npm run db:migrate
 *
 * Every statement in the schema is idempotent, so this is safe to re-run and
 * safe to wire into a deploy step.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { createClient } from "@libsql/client/web";

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(here, "..", "lib", "db", "schema.sql"), "utf8");

/*
 * Load .env.local the way Next does.
 *
 * This is a plain Node script and does not get Next's env loading. Without it
 * the script saw no TURSO_DATABASE_URL and silently fell back to a local file,
 * so the migration reported success while the real database stayed empty and
 * sign-up then failed on a missing table. There is no file fallback any more,
 * and a missing URL is a hard error.
 */
for (const file of [".env.local", ".env"]) {
  const full = join(here, "..", file);
  if (!existsSync(full)) continue;

  for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, raw] = match;
    if (process.env[key] !== undefined) continue; // a real env var wins
    process.env[key] = raw.trim().replace(/^["']|["']$/g, "");
  }
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error(
    [
      "TURSO_DATABASE_URL is not set.",
      "",
      "Put it and TURSO_AUTH_TOKEN in .env.local, or pass them inline:",
      '  TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:migrate',
    ].join("\n"),
  );
  process.exit(1);
}

if (url.startsWith("file:")) {
  console.error(
    `TURSO_DATABASE_URL is "${url}". The app speaks HTTP only, so migrating a ` +
      "local file would leave the real database empty. Point it at Turso.",
  );
  process.exit(1);
}

if (url.startsWith("libsql://") && !authToken) {
  console.error("TURSO_DATABASE_URL is remote but TURSO_AUTH_TOKEN is missing.");
  process.exit(1);
}

const db = createClient({ url, authToken });

// Split on semicolons at end of line, dropping the comment-only chunks that
// leaves behind. The schema deliberately contains no semicolons inside string
// literals, which is what makes this safe.
const statements = schema
  .split(/;\s*$/m)
  .map((statement) => statement.trim())
  .filter(
    (statement) =>
      statement &&
      !statement.split("\n").every((line) => line.trim().startsWith("--")),
  );

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
console.log("\ntables: " + tables.rows.map((row) => row.name).join(", "));
console.log("migration complete");
