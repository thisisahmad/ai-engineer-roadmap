import "server-only";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/** Completed stage ids for one path, or an empty set when signed out. */
export const getPathProgress = cache(
  async (pathSlug: string): Promise<Set<string>> => {
    const user = await getCurrentUser();
    if (!user) return new Set();

    const result = await db.execute({
      sql: "SELECT stage_id FROM progress WHERE user_id = ? AND path_slug = ?",
      args: [user.id, pathSlug],
    });

    return new Set(result.rows.map((row) => String(row.stage_id)));
  },
);

/** Completed counts per path, for the account dashboard. */
export const getProgressSummary = cache(
  async (): Promise<Record<string, number>> => {
    const user = await getCurrentUser();
    if (!user) return {};

    const result = await db.execute({
      sql: `SELECT path_slug, COUNT(*) AS completed
            FROM progress WHERE user_id = ?
            GROUP BY path_slug`,
      args: [user.id],
    });

    return Object.fromEntries(
      result.rows.map((row) => [String(row.path_slug), Number(row.completed)]),
    );
  },
);
