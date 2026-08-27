"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid, LogOut, UserRound } from "lucide-react";

import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Sign-in state in the header.
 *
 * Client-side on purpose: reading the session here on the server would make
 * every page that renders the header dynamic, costing CDN caching sitewide for
 * a control that occupies one corner of the screen.
 *
 * While the session is unknown it renders a fixed-width placeholder rather
 * than guessing. Guessing "Sign in" flashes the wrong state at signed-in
 * users; rendering nothing makes the header jump when the buttons appear.
 */
export function AuthNav() {
  const { user, loading } = useSession();
  const [open, setOpen] = useState(false);
  const signOutForm = useRef<HTMLFormElement>(null);

  if (loading) {
    return (
      <div
        className="h-8 w-[5.5rem] shrink-0 animate-pulse rounded-md bg-white/5"
        aria-hidden
      />
    );
  }

  if (!user) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <Button asChild variant="ghost" size="sm">
          <Link href="/sign-in/">Sign in</Link>
        </Button>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/sign-up/">Sign up</Link>
        </Button>
      </div>
    );
  }

  // First name only in the trigger — the header is tight, and a long full name
  // pushes the nav around on small screens. The full name is in the menu.
  const firstName = user.name.split(" ")[0];
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full border border-border/60 py-1 pl-1 pr-2.5",
            "text-sm transition-colors hover:border-violet-500/40 hover:bg-white/[0.04]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
            open && "border-violet-500/40 bg-white/[0.04]",
          )}
        >
          <span
            className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-amber-400 text-xs font-semibold text-background"
            aria-hidden
          >
            {initial}
          </span>
          <span className="max-w-[10ch] truncate">{firstName}</span>
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
          <span className="sr-only">Account menu</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          {user.phone ? (
            <p className="truncate text-xs text-muted-foreground">
              {user.phone}
            </p>
          ) : null}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/account/" className="cursor-pointer">
            <UserRound className="size-4" aria-hidden />
            Your account
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/#paths" className="cursor-pointer">
            <LayoutGrid className="size-4" aria-hidden />
            Browse the paths
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => signOutForm.current?.requestSubmit()}
          className="cursor-pointer text-rose-400 focus:text-rose-300"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* A real POST, not a Server Action. An action that clears the session
          cookie makes Next re-render the current route inside the action
          response, which can redirect and unmount this menu mid-flight. The
          route handler returns a 303 the browser follows as a full load, so
          the tree remounts with no session. */}
      <form ref={signOutForm} action="/api/sign-out/" method="post" hidden />
    </DropdownMenu>
  );
}
