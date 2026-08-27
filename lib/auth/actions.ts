"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";

import { fakeVerify, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: { name?: string; email?: string; phone?: string };
  /**
   * Set on success. The form then performs a FULL page navigation here.
   *
   * Deliberately not `redirect()`. A Server Action redirect is a client-side
   * RSC navigation, so the root layout never remounts — and SessionProvider,
   * which lives there, keeps the `user: null` it fetched before sign-in. The
   * header would still say "Sign in" while the account page showed the user.
   * A real navigation remounts the tree and re-reads the session.
   */
  redirectTo?: string;
};

/**
 * E.164-ish. Deliberately permissive — phone formats vary enough by country
 * that a strict pattern rejects real numbers, and this field is optional.
 */
const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+]?[\d\s().-]{7,20}$/, "That does not look like a phone number.")
  .optional()
  .or(z.literal("").transform(() => undefined));

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: phoneSchema,
  // Length is the only rule that reliably correlates with strength. Composition
  // rules ("must contain a symbol") push people toward Password1! and nothing
  // more. The 8-char floor matches current NIST guidance.
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(200, "That password is too long."),
});

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

/**
 * A database that is unreachable or unconfigured should not crash the page.
 *
 * Without this the error propagates out of the Server Action and React renders
 * the generic "Application error" screen, losing the form and everything the
 * person typed. They get a message they can act on instead, and the real cause
 * still goes to the server log for whoever is on call.
 */
function isInfrastructureError(cause: unknown): boolean {
  const text = String(cause);
  return (
    text.includes("TURSO_DATABASE_URL") ||
    text.includes("TURSO_AUTH_TOKEN") ||
    text.includes("ECONNREFUSED") ||
    text.includes("fetch failed") ||
    text.includes("UNAUTHORIZED") ||
    text.includes("SQLITE_") ||
    text.includes("MODULE_NOT_FOUND")
  );
}

const UNAVAILABLE =
  "Accounts are temporarily unavailable. Please try again shortly.";

function flatten(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/**
 * In-memory throttle, keyed by IP.
 *
 * Honest about its limits: serverless instances do not share memory, so this
 * slows down casual credential stuffing rather than stopping a distributed
 * attack. Turso has no native rate limiting; if this site gets real abuse,
 * move the counter to a shared store or put Vercel WAF in front.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

async function rateLimited(): Promise<boolean> {
  const store = await headers();
  const ip =
    store.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    store.get("x-real-ip") ??
    "unknown";

  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { name: raw.name, email: raw.email, phone: raw.phone };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flatten(parsed.error), values };
  }

  if (await rateLimited()) {
    return { error: "Too many attempts. Try again in a few minutes.", values };
  }

  const { name, email, phone, password } = parsed.data;

  try {
    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email],
    });

    if (existing.rows.length > 0) {
      return {
        fieldErrors: { email: "An account with that email already exists." },
        values,
      };
    }

    const now = Date.now();
    const id = randomUUID();

    try {
      await db.execute({
        sql: `INSERT INTO users (id, email, name, phone, password_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          email,
          name,
          phone ?? null,
          await hashPassword(password),
          now,
          now,
        ],
      });
    } catch (cause) {
      // The UNIQUE index is the real guard — the SELECT above races under
      // concurrent signups and cannot be relied on alone.
      if (String(cause).includes("UNIQUE")) {
        return {
          fieldErrors: { email: "An account with that email already exists." },
          values,
        };
      }
      throw cause;
    }

    const store = await headers();
    await createSession(id, store.get("user-agent") ?? undefined);
    return { redirectTo: "/account/" };
  } catch (cause) {
    if (isInfrastructureError(cause)) {
      console.error("[signUp] database unavailable:", cause);
      return { error: UNAVAILABLE, values };
    }
    throw cause;
  }
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { email: raw.email };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flatten(parsed.error), values };
  }

  if (await rateLimited()) {
    return { error: "Too many attempts. Try again in a few minutes.", values };
  }

  const { email, password } = parsed.data;

  try {
    const result = await db.execute({
      sql: "SELECT id, password_hash FROM users WHERE email = ?",
      args: [email],
    });

    const row = result.rows[0];

    if (!row) {
      // Same work and the same message as a wrong password, so neither timing
      // nor copy reveals whether the address is registered.
      await fakeVerify();
      return { error: "Email or password is incorrect.", values };
    }

    if (!(await verifyPassword(password, String(row.password_hash)))) {
      return { error: "Email or password is incorrect.", values };
    }

    const store = await headers();
    await createSession(String(row.id), store.get("user-agent") ?? undefined);
    return { redirectTo: "/account/" };
  } catch (cause) {
    if (isInfrastructureError(cause)) {
      console.error("[signIn] database unavailable:", cause);
      return { error: UNAVAILABLE, values };
    }
    throw cause;
  }
}

// Sign-out is deliberately NOT an action. See app/api/sign-out/route.ts: an
// action that clears the session cookie makes Next re-render the current
// route inside the action response, which redirects and unmounts the caller
// before it can navigate. A plain POST + 303 gives a real page load.
