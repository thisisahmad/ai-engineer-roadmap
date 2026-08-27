import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * Session state for the client.
 *
 * This endpoint exists so that reading the session does not force every page
 * into per-request rendering. Calling `cookies()` inside the shared header
 * opts the whole route tree out of static generation — the homepage, the path
 * pages, the resource library, all of it — which throws away CDN caching on
 * content that is identical for everyone.
 *
 * Instead the pages stay static and the small, genuinely per-user part is
 * fetched here after hydration.
 *
 * Returns progress for every path in one payload. It is a few hundred bytes
 * even for a completionist, and it saves the path pages a second round trip.
 */

// Reads cookies, so it must never be cached or prerendered.
export const dynamic = "force-dynamic";

export async function GET() {
  // A database problem must not break the header on every page. Treat it as
  // signed out: the checklist falls back to localStorage and the rest of the
  // site is unaffected.
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { user: null, progress: {} },
        // private: this is per-user, and a shared cache must never serve one
        // person's session state to another.
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const result = await db.execute({
      sql: "SELECT path_slug, stage_id FROM progress WHERE user_id = ?",
      args: [user.id],
    });

    const progress: Record<string, string[]> = {};
    for (const row of result.rows) {
      const slug = String(row.path_slug);
      (progress[slug] ??= []).push(String(row.stage_id));
    }

    return NextResponse.json(
      { user, progress },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (cause) {
    console.error("[api/me] session lookup failed:", cause);
    return NextResponse.json(
      { user: null, progress: {} },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
