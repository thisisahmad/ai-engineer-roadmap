import { NextResponse, type NextRequest } from "next/server";

import { destroySession } from "@/lib/auth/session";

/**
 * Sign out via a real form POST rather than a Server Action.
 *
 * A Server Action that mutates cookies makes Next re-render the current route
 * as part of the action response. On /account/ that route immediately
 * `redirect()`s a signed-out user to /sign-in/ — a client-side navigation that
 * happens inside the action response, unmounting the button before any
 * follow-up code can run and leaving the root layout (and so the cached
 * session in SessionProvider) mounted and stale.
 *
 * A plain POST to a route handler sidesteps all of that: the cookie is cleared
 * and the browser follows a genuine 303 to `/`, which is a full document load.
 * The whole tree remounts and re-reads the session. It also works with
 * JavaScript disabled.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await destroySession();

  // 303 forces the follow-up request to be a GET regardless of this POST.
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
