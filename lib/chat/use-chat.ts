"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSession } from "@/components/auth/session-provider";
import { messageText } from "@/lib/chat/types";
import type { ChatError, ChatEvent, ChatMessage } from "@/lib/chat/types";

/**
 * The conversation, shared by the floating widget and the /chat page.
 *
 * Transcripts live in the database against the signed-in user, so they follow
 * an account across devices. sessionStorage is gone with them: chat now
 * requires an account, which makes a browser-local copy both redundant and a
 * second source of truth to keep in sync.
 */

export const GREETING =
  "Not sure which AI path fits you? Tell me what you enjoy or what you are trying to build, and I will point you somewhere real.";

/** Shown whenever the advisor cannot be reached, whatever the cause. */
const UNREACHABLE = "Having trouble reaching the advisor right now.";

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: number;
};

export function useChat() {
  const { user, loading: sessionLoading } = useSession();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  /*
   * Mirrors `messages` so the sender can read the transcript synchronously.
   *
   * An earlier version assigned the history from inside a setMessages updater
   * and read it on the next line. React only guarantees updaters run during
   * render, so that variable was usually still empty and the request went out
   * with no messages at all. It appeared to work intermittently because React
   * sometimes evaluates an updater eagerly when the queue is empty — which is
   * why clicking a starter chip failed while typing the same text worked.
   */
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const refreshConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    try {
      const response = await fetch("/api/chat/conversations/", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json();
      setConversations(data.conversations ?? []);
    } catch {
      // History is a convenience; failing to list it should not break chat.
    }
  }, [user]);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  // Signing out must not leave the previous user's transcript on screen.
  useEffect(() => {
    if (!user && !sessionLoading) {
      setMessages([]);
      messagesRef.current = [];
      setConversationId(null);
    }
  }, [user, sessionLoading]);

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

      if (!user) {
        setError({ message: "Sign in to use the advisor.", requiresAuth: true });
        return;
      }

      setError(null);

      const history: ChatMessage[] = [
        ...messagesRef.current,
        { role: "user", parts: [{ type: "text", text: trimmed }] },
      ];
      // Kept current immediately: two sends in quick succession would
      // otherwise both read the pre-send transcript.
      messagesRef.current = history;
      setMessages([...history, { role: "assistant", parts: [] }]);

      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      // Lets `finally` tell "finished with nothing" from "already failed".
      let produced = false;
      let failed = false;

      try {
        const response = await fetch("/api/chat/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            conversationId,
            // Blank turns are dropped rather than sent. An assistant turn
            // flattens to "" when the model returns only reasoning or only a
            // recommendation block, and a blank message wedges the request.
            messages: history
              .map((message) => ({
                role: message.role,
                content: messageText(message).trim(),
              }))
              .filter((message) => message.content.length > 0),
          }),
        });

        if (!response.ok || !response.body) {
          const payload = await response.json().catch(() => null);
          const failure = new Error(payload?.error ?? UNREACHABLE) as Error & {
            offerQuiz?: boolean;
            requiresAuth?: boolean;
            friendly?: boolean;
          };
          failure.offerQuiz = payload?.offerQuiz ?? true;
          failure.requiresAuth = payload?.requiresAuth ?? false;
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
              produced = true;
              appendToLast((message) => {
                const parts = [...message.parts];
                const last = parts.at(-1);
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
              produced = true;
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
            } else if (event.type === "saved") {
              // Adopt the id so the next turn appends rather than starting a
              // second conversation for the same exchange.
              setConversationId(event.conversationId);
              void refreshConversations();
            } else if (event.type === "error") {
              failed = true;
              setError({ message: event.message, offerQuiz: event.offerQuiz });
            }
          }
        }
      } catch (cause) {
        if ((cause as Error)?.name === "AbortError") return;
        failed = true;
        const failure = cause as Error & {
          offerQuiz?: boolean;
          requiresAuth?: boolean;
          friendly?: boolean;
        };
        setError({
          // Only our own copy reaches the user. A raw fetch rejection reads
          // "Failed to fetch" or "Load failed" depending on the browser.
          message: failure?.friendly ? failure.message : UNREACHABLE,
          offerQuiz: failure?.requiresAuth
            ? false
            : (failure?.offerQuiz ?? true),
          requiresAuth: failure?.requiresAuth,
        });
      } finally {
        setStreaming(false);
        abortRef.current = null;

        // A stream can finish cleanly having produced nothing visible, since
        // gpt-oss streams reasoning in a separate field. Leaving the blank
        // bubble is what corrupted transcripts before, so drop it.
        setMessages((current) => {
          const last = current.at(-1);
          if (last?.role !== "assistant" || last.parts.length > 0) {
            return current;
          }
          return current.slice(0, -1);
        });

        if (!produced && !failed) {
          setError({
            message: "The advisor did not manage a reply. Try asking again.",
            offerQuiz: false,
          });
        }
      }
    },
    [appendToLast, conversationId, refreshConversations, streaming, user],
  );

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    messagesRef.current = [];
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    abortRef.current?.abort();
    setError(null);
    setLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/chat/conversations/?id=${encodeURIComponent(id)}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("Could not open that conversation.");
      const data = await response.json();
      const loaded: ChatMessage[] = data.conversation?.messages ?? [];
      messagesRef.current = loaded;
      setMessages(loaded);
      setConversationId(id);
    } catch {
      setError({
        message: "Could not open that conversation.",
        offerQuiz: false,
      });
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const removeConversation = useCallback(
    async (id: string) => {
      // Optimistic: the row leaving the list immediately is the point of a
      // delete button, and it is restored below if the request fails.
      const previous = conversations;
      setConversations((current) => current.filter((c) => c.id !== id));
      if (id === conversationId) newChat();

      try {
        const response = await fetch(
          `/api/chat/conversations/?id=${encodeURIComponent(id)}`,
          { method: "DELETE" },
        );
        if (!response.ok) throw new Error();
      } catch {
        setConversations(previous);
        setError({ message: "Could not delete that chat.", offerQuiz: false });
      }
    },
    [conversationId, conversations, newChat],
  );

  return {
    messages,
    conversations,
    conversationId,
    send,
    newChat,
    openConversation,
    removeConversation,
    streaming,
    error,
    loadingHistory,
    signedIn: !!user,
    ready: !sessionLoading,
  };
}
