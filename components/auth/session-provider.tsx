"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { SessionUser } from "@/lib/auth/session";

/**
 * Client-side session state, fetched once per page load from /api/me.
 *
 * Deliberately client-side. Reading the session on the server inside the
 * shared header would opt every page out of static generation, so content
 * pages ship prerendered and this small per-user layer resolves after
 * hydration.
 *
 * The cost is one frame where sign-in state is unknown. Consumers get
 * `loading` so they can render a neutral placeholder rather than flashing
 * "Sign in" at somebody who is already signed in.
 */

type SessionValue = {
  user: SessionUser | null;
  /** path slug -> completed stage ids */
  progress: Record<string, string[]>;
  loading: boolean;
  /** Re-reads /api/me. Called after a merge so the UI reflects the server. */
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [progress, setProgress] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      // trailingSlash is on, so /api/me 308s to /api/me/. Request the
      // canonical form directly rather than paying a redirect on every load.
      const response = await fetch("/api/me/", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      setUser(data.user ?? null);
      setProgress(data.progress ?? {});
    } catch {
      // Offline, or the endpoint is down. Treat as signed out: the checklist
      // falls back to localStorage rather than the page breaking.
      setUser(null);
      setProgress({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo(
    () => ({ user, progress, loading, refresh: load }),
    [user, progress, loading, load],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return context;
}
