import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";

import { db } from "@/lib/db/client";

/**
 * Session handling.
 *
 * The cookie carries a random 256-bit token. The database stores only its
 * SHA-256, so a dump of the sessions table cannot be replayed as a login —
 * the same reason passwords are not stored in the clear.
 *
 * SHA-256 without a work factor is correct here: unlike a password, the token
 * is full-entropy random, so there is no dictionary to brute force.
 */

const COOKIE = "roadmap_session";
const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
// Past this point a still-valid session is reissued, so active users are not
// logged out on a hard 30-day boundary.
const RENEW_WITHIN_MS = 1000 * 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
};

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string, userAgent?: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();

  await db.execute({
    sql: `INSERT INTO sessions (id, user_id, expires_at, created_at, user_agent)
          VALUES (?, ?, ?, ?, ?)`,
    args: [hashToken(token), userId, now + TTL_MS, now, userAgent ?? null],
  });

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true, // unreadable from JavaScript, so XSS cannot steal it
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // survives normal navigation, blocks cross-site POSTs
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  });
}

/**
 * The signed-in user, or null.
 *
 * `cache` dedupes this across a single render, so a layout and three server
 * components asking for the user cost one query rather than four.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const id = hashToken(token);
  const result = await db.execute({
    sql: `SELECT s.expires_at, u.id, u.email, u.name, u.phone
          FROM sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.id = ?`,
    args: [id],
  });

  const row = result.rows[0];
  if (!row) return null;

  if (Number(row.expires_at) < Date.now()) {
    // Expired. Clear it eagerly rather than leaving dead rows to accumulate.
    await db.execute({ sql: "DELETE FROM sessions WHERE id = ?", args: [id] });
    return null;
  }

  if (Number(row.expires_at) - Date.now() < RENEW_WITHIN_MS) {
    await db.execute({
      sql: "UPDATE sessions SET expires_at = ? WHERE id = ?",
      args: [Date.now() + TTL_MS, id],
    });
  }

  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    phone: row.phone === null ? null : String(row.phone),
  };
});

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;

  if (token) {
    await db.execute({
      sql: "DELETE FROM sessions WHERE id = ?",
      args: [hashToken(token)],
    });
  }

  store.delete(COOKIE);
}

/** Invalidates every session for a user — used after a password change. */
export async function destroyAllSessions(userId: string) {
  await db.execute({
    sql: "DELETE FROM sessions WHERE user_id = ?",
    args: [userId],
  });
}
