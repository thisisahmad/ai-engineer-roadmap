"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Check, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Per-path stage completion, persisted to localStorage only.
 *
 * No account, no backend, no sync between devices — that is the whole design.
 * State is read in an effect rather than during render, because localStorage
 * does not exist on the server and reading it inline would produce markup that
 * disagrees with the prerendered HTML.
 *
 * Every read and write is wrapped: localStorage throws outright in some
 * contexts (Safari private mode historically, browsers set to block site data,
 * embedded webviews), and a checklist is not worth breaking a page over.
 */

const STORAGE_PREFIX = "ai-roadmap:progress:";

type ProgressValue = {
  done: Set<string>;
  toggle: (stageId: string) => void;
  reset: () => void;
  /** False until the effect has run, so the UI can avoid flashing zeroes. */
  ready: boolean;
};

const ProgressContext = createContext<ProgressValue | null>(null);

function read(slug: string): string[] {
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

function write(slug: string, ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(ids));
  } catch {
    // Storage full or blocked. The in-memory state still works for this visit.
  }
}

export function PathProgressProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDone(new Set(read(slug)));
    setReady(true);
  }, [slug]);

  const toggle = useCallback(
    (stageId: string) => {
      setDone((current) => {
        const next = new Set(current);
        if (next.has(stageId)) next.delete(stageId);
        else next.add(stageId);
        write(slug, [...next]);
        return next;
      });
    },
    [slug],
  );

  const reset = useCallback(() => {
    setDone(new Set());
    write(slug, []);
  }, [slug]);

  const value = useMemo(
    () => ({ done, toggle, reset, ready }),
    [done, toggle, reset, ready],
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
  const { done, reset, ready } = useProgress();

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
            // Announce completion changes without announcing the initial read.
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
            // No transition on the first paint, or the bar visibly animates
            // from zero every time the page loads.
            ready ? "transition-all duration-500" : "",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Saved in this browser only — no account, and it will not follow you to
        another device.
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
  const { done, toggle } = useProgress();
  const isDone = done.has(stageId);

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
        {isDone ? <Check className="size-2.5 text-background" /> : null}
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
