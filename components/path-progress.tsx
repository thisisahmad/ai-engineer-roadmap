"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Check, Loader2, RotateCcw } from "lucide-react";

import { useSession } from "@/components/auth/session-provider";
import {
  mergeLocalProgress,
  resetPathProgress,
  setStageDone,
} from "@/lib/progress/actions";
import { cn } from "@/lib/utils";

/**
 * Per-path stage completion, in one of two modes.
 *
 *   signed out  localStorage, per browser. Unchanged from before accounts
 *               existed, so someone can use the checklist without registering.
 *   signed in   the database, via Server Actions, so progress follows the
 *               account across devices.
 *
 * Signing in merges any anonymous localStorage progress into the account
 * exactly once — a union, never a subtraction, so work done while logged out
 * is never silently discarded.
 *
 * Writes are optimistic: the checkbox flips immediately and rolls back if the
 * server rejects it. A checklist that waits on a round trip feels broken.
 */

const STORAGE_PREFIX = "ai-roadmap:progress:";
const MERGED_FLAG = "ai-roadmap:merged";

type ProgressValue = {
  done: Set<string>;
  toggle: (stageId: string) => void;
  reset: () => void;
  ready: boolean;
  signedIn: boolean;
  pending: Set<string>;
  error: string | null;
};

const ProgressContext = createContext<ProgressValue | null>(null);

function readLocal(slug: string): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + slug);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function writeLocal(slug: string, ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(ids));
  } catch {
    // Storage full or blocked. In-memory state still works for this visit.
  }
}

/** Every anonymous path record in this browser, for the post-sign-in merge. */
function readAllLocal(): { pathSlug: string; stageIds: string[] }[] {
  try {
    const out: { pathSlug: string; stageIds: string[] }[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      const pathSlug = key.slice(STORAGE_PREFIX.length);
      const stageIds = readLocal(pathSlug);
      if (stageIds.length > 0) out.push({ pathSlug, stageIds });
    }
    return out;
  } catch {
    return [];
  }
}

export function PathProgressProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  // Session comes from the client-side provider rather than props, so this
  // page can stay statically prerendered and CDN-cached.
  const { user, progress, loading, refresh } = useSession();
  const signedIn = Boolean(user);

  const [done, setDone] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const merged = useRef(false);

  // Adopt whichever source applies once the session resolves. localStorage is
  // read in an effect because it does not exist on the server, and reading it
  // during render would produce markup that disagrees with the prerendered
  // HTML.
  useEffect(() => {
    if (loading) return;
    setDone(new Set(signedIn ? (progress[slug] ?? []) : readLocal(slug)));
    setReady(true);
  }, [slug, signedIn, loading, progress]);

  // Signed in: fold anonymous progress into the account, once per browser.
  useEffect(() => {
    if (!signedIn || merged.current) return;
    merged.current = true;

    try {
      if (window.localStorage.getItem(MERGED_FLAG)) return;
    } catch {
      return;
    }

    const entries = readAllLocal();
    if (entries.length === 0) {
      try {
        window.localStorage.setItem(MERGED_FLAG, "1");
      } catch {
        /* nothing to merge anyway */
      }
      return;
    }

    void mergeLocalProgress(entries).then(async (result) => {
      if (!result.ok) return;
      // Re-read so every other path reflects the merge too, not just this one.
      await refresh();
      try {
        window.localStorage.setItem(MERGED_FLAG, "1");
      } catch {
        /* flag is an optimisation, not a correctness requirement */
      }
      const mine = entries.find((e) => e.pathSlug === slug);
      if (mine) setDone((cur) => new Set([...cur, ...mine.stageIds]));
    });
  }, [signedIn, slug, refresh]);

  const toggle = useCallback(
    (stageId: string) => {
      setError(null);
      const next = !done.has(stageId);

      // Optimistic flip.
      setDone((cur) => {
        const copy = new Set(cur);
        if (next) copy.add(stageId);
        else copy.delete(stageId);
        if (!signedIn) writeLocal(slug, [...copy]);
        return copy;
      });

      if (!signedIn) return;

      setPending((cur) => new Set(cur).add(stageId));

      void setStageDone(slug, stageId, next)
        .then((result) => {
          if (result.ok) return;
          // Roll back — the checkbox must not claim a save that did not happen.
          setDone((cur) => {
            const copy = new Set(cur);
            if (next) copy.delete(stageId);
            else copy.add(stageId);
            return copy;
          });
          setError(result.error ?? "Could not save. Try again.");
        })
        .catch(() => {
          setDone((cur) => {
            const copy = new Set(cur);
            if (next) copy.delete(stageId);
            else copy.add(stageId);
            return copy;
          });
          setError("Could not reach the server. Your change was not saved.");
        })
        .finally(() => {
          setPending((cur) => {
            const copy = new Set(cur);
            copy.delete(stageId);
            return copy;
          });
        });
    },
    [done, signedIn, slug],
  );

  const reset = useCallback(() => {
    const previous = done;
    setDone(new Set());
    setError(null);

    if (!signedIn) {
      writeLocal(slug, []);
      return;
    }

    void resetPathProgress(slug).then((result) => {
      if (!result.ok) {
        setDone(previous);
        setError(result.error ?? "Could not reset.");
      }
    });
  }, [done, signedIn, slug]);

  const value = useMemo(
    () => ({ done, toggle, reset, ready, signedIn, pending, error }),
    [done, toggle, reset, ready, signedIn, pending, error],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used inside PathProgressProvider");
  }
  return context;
}

/** The bar and counter shown above the stage list. */
export function PathProgressBar({
  stageIds,
  className,
}: {
  stageIds: string[];
  className?: string;
}) {
  const { done, reset, ready, signedIn, error } = useProgress();

  const completed = stageIds.filter((id) => done.has(id)).length;
  const percent = stageIds.length
    ? Math.round((completed / stageIds.length) * 100)
    : 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/30 p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Your progress</p>
          <p
            className="mt-0.5 text-xs text-muted-foreground"
            aria-live={ready ? "polite" : "off"}
          >
            {completed} of {stageIds.length} stages
            {completed > 0 ? ` · ${percent}%` : ""}
          </p>
        </div>

        {completed > 0 ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3" aria-hidden />
            Reset
          </button>
        ) : null}
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={stageIds.length}
        aria-label="Stages completed"
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400",
            ready ? "transition-all duration-500" : "",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-[11px] text-rose-400">
          {error}
        </p>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {signedIn ? (
          "Saved to your account — it follows you to any device you sign in on."
        ) : (
          <>
            Saved in this browser only.{" "}
            <Link
              href="/sign-up/"
              className="text-violet-400 underline underline-offset-2"
            >
              Create an account
            </Link>{" "}
            to keep it across devices — anything you have already ticked comes
            with you.
          </>
        )}
      </p>
    </div>
  );
}

/** The per-stage checkbox rendered in the timeline. */
export function StageCheckbox({
  stageId,
  stageTitle,
}: {
  stageId: string;
  stageTitle: string;
}) {
  const { done, toggle, pending } = useProgress();
  const isDone = done.has(stageId);
  const isSaving = pending.has(stageId);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isDone}
      onClick={() => toggle(stageId)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
        isDone
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
          : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-3.5 items-center justify-center rounded-[4px] border transition-colors",
          isDone ? "border-emerald-400 bg-emerald-400" : "border-current",
        )}
        aria-hidden
      >
        {isSaving ? (
          <Loader2 className="size-2.5 animate-spin" />
        ) : isDone ? (
          <Check className="size-2.5 text-background" />
        ) : null}
      </span>
      {isDone ? "Completed" : "Mark done"}
      <span className="sr-only">: {stageTitle}</span>
    </button>
  );
}

/** Dims a stage card once it is checked off. */
export function useStageDone(stageId: string) {
  return useProgress().done.has(stageId);
}
