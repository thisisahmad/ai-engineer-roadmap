"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { messageText } from "@/lib/chat/types";
import type { ChatError, ChatEvent, ChatMessage } from "@/lib/chat/types";

/**
 * The conversation, shared by the floating widget and the /chat page.
 *
 * One hook rather than two copies of the streaming loop: they differ only in
 * shell, and a fix to reconnect or error handling should not need applying
 * twice.
 */

const STORAGE_KEY = "ai-roadmap:chat";

/** Shown whenever the advisor cannot be reached, whatever the cause. */
const UNREACHABLE = "Having trouble reaching the advisor right now.";

/**
 * Shown as the first assistant turn but never sent back as history — the
 * model did not say it, and feeding it back would have the model treat its own
 * greeting as something it had already decided.
 */
export const GREETING =
  "Not sure which AI path fits you? Tell me what you enjoy or what you are trying to build, and I will point you somewhere real.";

/**
 * sessionStorage, not localStorage.
 *
 * The conversation should survive navigating between pages in one visit and
 * be gone on the next. Every access is wrapped: storage throws outright in
 * some contexts (private windows, embedded webviews, browsers set to block
 * site data) and a transcript is not worth breaking a page over.
 */
function read(): ChatMessage[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Shape-check rather than trust: a stale entry from an older build would
    // otherwise crash the render it is read into.
    return parsed.filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        Array.isArray(m.parts),
    );
  } catch {
    return [];
  }
}

function write(messages: ChatMessage[]) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Full or blocked. The in-memory conversation still works for this visit.
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  /** False until the stored transcript has been read, so nothing flashes. */
  const [ready, setReady] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Restored in an effect because sessionStorage does not exist on the server;
  // reading it during render would produce markup that disagrees with the
  // prerendered HTML.
  useEffect(() => {
    setMessages(read());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) write(messages);
  }, [messages, ready]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const appendToLast = useCallback(
    (update: (message: ChatMessage) => ChatMessage) => {
      setMessages((current) => {
        const next = [...current];
        const last = next.at(-1);
        if (!last || last.role !== "assistant") return current;
        next[next.length - 1] = update(last);
        return next;
      });
    },
    [],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      setError(null);

      let history: ChatMessage[] = [];
      setMessages((current) => {
        history = [
          ...current,
          { role: "user", parts: [{ type: "text", text: trimmed }] },
        ];
        return [...history, { role: "assistant", parts: [] }];
      });

      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Trailing slash matters: `trailingSlash: true` would 308 this, and a
        // redirected POST silently loses its body.
        const response = await fetch("/api/chat/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: history.map((message) => ({
              role: message.role,
              content: messageText(message),
            })),
          }),
        });

        if (!response.ok || !response.body) {
          const payload = await response.json().catch(() => null);
          // Thrown so one catch handles both a failed response and a dropped
          // connection; offerQuiz rides along so the UI can offer the quiz.
          const failure = new Error(
            payload?.error ?? UNREACHABLE,
          ) as Error & { offerQuiz?: boolean; friendly?: boolean };
          // A response that never arrived is the advisor being unreachable,
          // which is exactly when the quiz is the useful alternative.
          failure.offerQuiz = payload?.offerQuiz ?? true;
          // Marks the message as ours and safe to show. Anything without this
          // is a raw runtime error and gets replaced below.
          failure.friendly = true;
          throw failure;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const raw of frames) {
            const line = raw.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;

            let event: ChatEvent;
            try {
              event = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }

            if (event.type === "delta") {
              appendToLast((message) => {
                const parts = [...message.parts];
                const last = parts.at(-1);
                // Merge into the trailing text part, so a turn is not split
                // into one part per token.
                if (last?.type === "text") {
                  parts[parts.length - 1] = {
                    type: "text",
                    text: last.text + event.text,
                  };
                } else {
                  parts.push({ type: "text", text: event.text });
                }
                return { ...message, parts };
              });
            } else if (event.type === "recommendation") {
              appendToLast((message) => ({
                ...message,
                parts: [
                  ...message.parts,
                  {
                    type: "recommendation",
                    recommendation: event.recommendation,
                  },
                ],
              }));
            } else if (event.type === "error") {
              setError({ message: event.message, offerQuiz: event.offerQuiz });
            }
          }
        }
      } catch (cause) {
        if ((cause as Error)?.name === "AbortError") return;
        const failure = cause as Error & {
          offerQuiz?: boolean;
          friendly?: boolean;
        };
        setError({
          // Only our own copy reaches the user. A raw fetch rejection reads
          // "Failed to fetch", "NetworkError" or "Load failed" depending on
          // the browser — developer jargon, and not something to show someone
          // asking for career advice.
          message: failure?.friendly ? failure.message : UNREACHABLE,
          // A network-level throw means the request never completed, so the
          // advisor is unreachable rather than merely unhappy.
          offerQuiz: failure?.offerQuiz ?? true,
        });
        // Drop the empty assistant turn rather than leaving a blank bubble.
        setMessages((current) =>
          current.at(-1)?.role === "assistant" &&
          current.at(-1)?.parts.length === 0
            ? current.slice(0, -1)
            : current,
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [appendToLast, streaming],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clear */
    }
  }, []);

  return { messages, send, reset, streaming, error, ready };
}
