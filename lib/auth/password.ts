import "server-only";

import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";
import { promisify } from "node:util";

// promisify() resolves to scrypt's 3-argument overload and drops the one that
// takes options, so the cost parameters below would be a type error. Assert the
// signature that is actually being called.
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/**
 * Password hashing with scrypt.
 *
 * scrypt is memory-hard and ships in Node's standard library, so there is no
 * native module to compile — argon2 and bcrypt both pull binaries that are
 * awkward on serverless.
 *
 * N = 2^15 costs ~32MB and ~65ms per hash on a modern core. That slowness is
 * the point: it is what makes an offline attack on a stolen database
 * expensive. It is also the ceiling worth paying on serverless, where several
 * concurrent sign-ins each hold their own 32MB — 2^17, the figure usually
 * quoted for a dedicated server, would be 128MB apiece.
 *
 * Encoded as `scrypt$N$r$p$salt$hash` so the cost parameters travel with the
 * hash. Raising them later does not invalidate existing passwords — each hash
 * is verified with the parameters it was created under.
 */

const N = 32768; // CPU/memory cost — 2^15
const R = 8; // block size
const P = 1; // parallelisation
const KEY_LEN = 64;
const SALT_LEN = 16;

// 128 * N * r = 32MB, which is exactly Node's default limit — so it must be
// raised explicitly or every hash throws. Headroom left for a future bump.
const MAX_MEM = 128 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const derived = (await scryptAsync(password.normalize("NFKC"), salt, KEY_LEN, {
    N,
    r: R,
    p: P,
    maxmem: MAX_MEM,
  }));

  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

/**
 * Constant-time verification. Returns false rather than throwing on a
 * malformed stored hash, so one corrupt row cannot 500 the sign-in route.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
    if (scheme !== "scrypt") return false;

    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");

    const derived = (await scryptAsync(
      password.normalize("NFKC"),
      salt,
      expected.length,
      { N: Number(n), r: Number(r), p: Number(p), maxmem: MAX_MEM },
    ));

    // Lengths must match before timingSafeEqual, which throws otherwise.
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Burns roughly the same time as a real verification.
 *
 * Called when the email does not exist, so that "no such user" and "wrong
 * password" take the same time. Without it, response timing tells an attacker
 * which email addresses are registered.
 */
export async function fakeVerify(): Promise<void> {
  await scryptAsync("timing-equaliser", randomBytes(SALT_LEN), KEY_LEN, {
    N,
    r: R,
    p: P,
    maxmem: MAX_MEM,
  });
}
