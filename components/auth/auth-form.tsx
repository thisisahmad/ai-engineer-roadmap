"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp, type AuthState } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

/**
 * Sign-in and sign-up forms.
 *
 * Both are client components that import their Server Action directly. An
 * earlier version took the fields as a render prop from the page, which fails
 * at runtime: a plain function cannot cross the server/client boundary. Server
 * Actions can, because they serialise as a reference rather than as code.
 *
 * Each is a real <form> with a Server Action, so it submits and validates with
 * JavaScript disabled. Values are echoed back from the action on error — a
 * form that empties itself because you mistyped one field is the fastest way
 * to lose someone.
 */

/**
 * Full page navigation once an action reports success.
 *
 * `window.location`, not the router, and not `redirect()` in the action. Both
 * of those are client-side RSC navigations that leave the root layout mounted
 * — so SessionProvider keeps the `user: null` it fetched before sign-in, and
 * the header goes on saying "Sign in" to somebody who just signed in. A real
 * navigation remounts the tree and re-reads the session.
 */
function useAuthRedirect(state: AuthState) {
  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Working…
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function Field({
  id,
  label,
  type = "text",
  autoComplete,
  required,
  hint,
  error,
  defaultValue,
  inputMode,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  defaultValue?: string;
  inputMode?: "text" | "email" | "tel";
}) {
  const describedBy =
    [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {!required ? (
          <span className="text-xs text-muted-foreground">Optional</span>
        ) : null}
      </div>

      <Input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          error && "border-rose-500/60 focus-visible:ring-rose-500/30",
        )}
      />

      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="text-xs text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300"
    >
      {message}
    </div>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(signUp, {});
  useAuthRedirect(state);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormError message={state.error} />

      <Field
        id="name"
        label="Name"
        autoComplete="name"
        required
        error={state.fieldErrors?.name}
        defaultValue={state.values?.name}
      />
      <Field
        id="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
        defaultValue={state.values?.email}
      />
      <Field
        id="phone"
        label="Phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint="Only if you want to hear about new paths. Never shown publicly."
        error={state.fieldErrors?.phone}
        defaultValue={state.values?.phone}
      />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters. Longer beats complicated."
        error={state.fieldErrors?.password}
      />

      <Submit label="Create account" />
    </form>
  );
}

export function SignInForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(signIn, {});
  useAuthRedirect(state);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormError message={state.error} />

      <Field
        id="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
        defaultValue={state.values?.email}
      />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />

      <Submit label="Sign in" />
    </form>
  );
}
