"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * Stage completion, stored per user.
 *
 * A row exists only for completed stages, so un-checking is a DELETE and there
 * is no tri-state. Every action re-reads the session rather than trusting a
 * user id from the client — a server action is a public HTTP endpoint, so its
 * arguments are attacker-controlled.
 */

const slug = z.string().trim().min(1).max(120);
const stageId = z.string().trim().min(1).max(120);

export type ProgressResult = { ok: boolean; error?: string };

export async function setStageDone(
  pathSlug: string,
  stage: string,
  done: boolean,
): Promise<ProgressResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = z.object({ pathSlug: slug, stage: stageId }).safeParse({
    pathSlug,
    stage,
  });
  if (!parsed.success) return { ok: false, error: "Invalid stage." };

  if (done) {
    await db.execute({
      // Re-checking an already-complete stage must not error or move the
      // original completion date.
      sql: `INSERT INTO progress (user_id, path_slug, stage_id, completed_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (user_id, path_slug, stage_id) DO NOTHING`,
      args: [user.id, parsed.data.pathSlug, parsed.data.stage, Date.now()],
    });
  } else {
    await db.execute({
      sql: `DELETE FROM progress
            WHERE user_id = ? AND path_slug = ? AND stage_id = ?`,
      args: [user.id, parsed.data.pathSlug, parsed.data.stage],
    });
  }

  revalidatePath(`/paths/${parsed.data.pathSlug}`);
  return { ok: true };
}

export async function resetPathProgress(
  pathSlug: string,
): Promise<ProgressResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = slug.safeParse(pathSlug);
  if (!parsed.success) return { ok: false, error: "Invalid path." };

  await db.execute({
    sql: "DELETE FROM progress WHERE user_id = ? AND path_slug = ?",
    args: [user.id, parsed.data],
  });

  revalidatePath(`/paths/${parsed.data}`);
  return { ok: true };
}

/**
 * One-time merge of anonymous localStorage progress into the account.
 *
 * Called by the client right after sign-in. Union, never subtraction: a stage
 * ticked on either side stays ticked, so signing in cannot silently erase work
 * done while logged out.
 */
export async function mergeLocalProgress(
  entries: { pathSlug: string; stageIds: string[] }[],
): Promise<ProgressResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = z
    .array(
      z.object({ pathSlug: slug, stageIds: z.array(stageId).max(200) }),
    )
    .max(20)
    .safeParse(entries);

  if (!parsed.success) return { ok: false, error: "Invalid payload." };

  const now = Date.now();
  const statements = parsed.data.flatMap((entry) =>
    entry.stageIds.map((id) => ({
      sql: `INSERT INTO progress (user_id, path_slug, stage_id, completed_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (user_id, path_slug, stage_id) DO NOTHING`,
      args: [user.id, entry.pathSlug, id, now],
    })),
  );

  if (statements.length === 0) return { ok: true };

  // Batched so a partial failure cannot leave progress half-merged.
  await db.batch(statements, "write");

  for (const entry of parsed.data) revalidatePath(`/paths/${entry.pathSlug}`);
  return { ok: true };
}
