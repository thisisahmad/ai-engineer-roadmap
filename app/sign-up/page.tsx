import Link from "next/link";
import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/auth-form";
import { GridBackdrop } from "@/components/motion/grid-backdrop";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a free account to save your roadmap progress across devices.",
  // Auth pages carry no content worth indexing and would only dilute the
  // content pages in search results.
  robots: { index: false, follow: false },
};

export default async function SignUpPage() {
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

      <h1 className="text-balance text-4xl">Create your account</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Free, and it takes a moment. Your progress starts following you to any
        device you sign in on — including anything you have already ticked off
        in this browser.
      </p>

      <div className="mt-8">
        <SignUpForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in/"
          className="text-violet-400 underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
