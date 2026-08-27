import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

import { GridBackdrop } from "@/components/motion/grid-backdrop";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentUser } from "@/lib/auth/session";
import { accent } from "@/lib/accents";
import { getAllPaths } from "@/lib/content";
import { getProgressSummary } from "@/lib/progress/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  // A database problem here should send people to sign-in rather than render
  // the generic application-error screen.
  //
  // Next signals "this route is dynamic" by throwing, and `redirect()` throws
  // too. Swallowing those would break the framework's own control flow, so
  // anything carrying a digest is re-thrown and only real failures are caught.
  const user = await getCurrentUser().catch((cause) => {
    if (cause && typeof cause === "object" && "digest" in cause) throw cause;
    console.error("[account] session lookup failed:", cause);
    return null;
  });
  if (!user) redirect("/sign-in/");

  const paths = getAllPaths();
  const summary = await getProgressSummary();

  const started = paths
    .map((path) => ({
      path,
      completed: summary[path.slug] ?? 0,
      total: path.stages.length,
    }))
    .filter((row) => row.completed > 0)
    .sort((a, b) => b.completed / b.total - a.completed / a.total);

  return (
    <div className="relative isolate mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <GridBackdrop pattern="dots" bloom="violet" />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-balance text-4xl">{user.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
          {user.phone ? (
            <p className="text-sm text-muted-foreground">{user.phone}</p>
          ) : null}
        </div>

        <SignOutButton />
      </header>

      <section className="mt-12" aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="font-display text-2xl">
          Your progress
        </h2>

        {started.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border/70 p-6">
            <p className="text-sm text-muted-foreground">
              Nothing ticked off yet. Open a path and start marking stages as
              you finish them — it saves to your account automatically.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/#paths">
                Browse the paths
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {started.map(({ path, completed, total }) => {
              const a = accent(path.accent);
              const percent = Math.round((completed / total) * 100);

              return (
                <li key={path.slug}>
                  <Link
                    href={`/paths/${path.slug}/`}
                    className="group block rounded-xl border border-border/60 bg-card/40 p-4 transition-colors hover:bg-card/70"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{path.title}</span>
                      <span className={cn("text-sm tabular-nums", a.text)}>
                        {completed}/{total}
                      </span>
                    </div>
                    <div
                      className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
                      role="progressbar"
                      aria-valuenow={completed}
                      aria-valuemin={0}
                      aria-valuemax={total}
                      aria-label={`${path.title} stages completed`}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
