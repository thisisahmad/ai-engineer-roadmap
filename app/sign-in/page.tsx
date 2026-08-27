import Link from "next/link";
import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/auth-form";
import { GridBackdrop } from "@/components/motion/grid-backdrop";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to pick your roadmap up where you left it.",
  robots: { index: false, follow: false },
};

export default async function SignInPage() {
  /*
   * No `if (signed in) redirect(...)` guard here on purpose.
   *
   * A Server Action that sets a cookie makes Next re-render the current route
   * as part of the action response. With a guard, that re-render redirects to
   * /account/ from inside the action — a client-side navigation that unmounts
   * this form before it can read the action's return value, and leaves the
   * root layout (and the session cached in SessionProvider) mounted and stale.
   * The header then still says "Sign in" to somebody who just signed in.
   *
   * Without the guard the action's `redirectTo` reaches the client, which does
   * a real navigation and remounts the tree. A signed-in visitor who lands
   * here just sees the form; harmless, and the round trip is one click.
   */

  return (
    <div className="relative isolate mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
      <GridBackdrop pattern="dots" bloom="violet" />

      <h1 className="text-balance text-4xl">Sign in</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Pick up where you left off.
      </p>

      <div className="mt-8">
        <SignInForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link
          href="/sign-up/"
          className="text-violet-400 underline underline-offset-4"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
