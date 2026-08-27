"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

/**
 * Sign out.
 *
 * A native form POST to a route handler, not a Server Action. An action that
 * clears the session cookie makes Next re-render the current route in the
 * action response, and /account/ redirects a signed-out user away — which
 * unmounts this button mid-flight and leaves the root layout, and the session
 * cached in SessionProvider, stale.
 *
 * The POST returns a 303, the browser does a full document load of `/`, and
 * everything remounts with no session. Works without JavaScript too.
 */
function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending}
      className={className}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/api/sign-out/" method="post">
      <SubmitButton className={className} />
    </form>
  );
}
