"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, RotateCcw } from "lucide-react";

import { RecommendationCard } from "@/components/chat/recommendation-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { messageText } from "@/lib/chat/types";
import type { ChatEvent, ChatMessage } from "@/lib/chat/types";

/**
 * The advisor conversation.
 *
 * Reads the SSE stream from /api/chat/ and appends text as it arrives.
 * Recommendations come through as their own event, already validated against
 * real content, so this component never parses model output or decides what is
 * real — it only renders what the server vouched for.
 */

const OPENERS = [
  "I can code but I have no idea which AI path to pick.",
  "I like maths. Should I train models or build products?",
  "I'm a web developer. What's the fastest path into AI?",
];

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Follow the conversation as it grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  // Cancelling on unmount stops the server generating for a page nobody is on.
  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setError(null);
    setInput("");

    const history: ChatMessage[] = [
      ...messages,
      { role: "user", parts: [{ type: "text", text: trimmed }] },
    ];
    setMessages([...history, { role: "assistant", parts: [] }]);
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
        throw new Error(payload?.error ?? "The assistant is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data:"));
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
              // Merge into the trailing text part so a turn is not split into
              // one part per token.
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
                { type: "recommendation", recommendation: event.recommendation },
              ],
            }));
          } else if (event.type === "error") {
            setError(event.message);
          }
        }
      }
    } catch (cause) {
      if ((cause as Error)?.name === "AbortError") return;
      setError(
        cause instanceof Error ? cause.message : "Something went wrong.",
      );
      // Drop the empty assistant turn so the transcript does not keep a blank.
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
  }

  function appendToLast(update: (message: ChatMessage) => ChatMessage) {
    setMessages((current) => {
      const next = [...current];
      const last = next.at(-1);
      if (!last || last.role !== "assistant") return current;
      next[next.length - 1] = update(last);
      return next;
    });
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-[min(72vh,42rem)] flex-col rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm">
      <div
        ref={scrollRef}
        className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6"
      >
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Describe where you are — what you already know, what you enjoy,
              what you want to build. I only recommend paths that exist on this
              site.
            </p>
            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {OPENERS.map((opener) => (
                <li key={opener}>
                  <button
                    type="button"
                    onClick={() => void send(opener)}
                    className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-violet-500/40 hover:text-foreground"
                  >
                    {opener}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                message.role === "user"
                  ? "max-w-[85%] bg-violet-500/15 text-foreground"
                  // Wider, because an assistant turn can contain cards and a
                  // card squeezed into 85% of the column reads as cramped.
                  : "w-full max-w-[95%] bg-white/[0.04]",
              )}
            >
              {/* Parts render in arrival order, so a card sits exactly where
                  the model placed it rather than after all the prose. Line
                  breaks are preserved without a markdown renderer, since the
                  prompt asks for short prose rather than documents. */}
              {message.parts.map((part, partIndex) =>
                part.type === "text" ? (
                  <p key={partIndex} className="whitespace-pre-wrap">
                    {part.text}
                  </p>
                ) : (
                  <RecommendationCard
                    key={partIndex}
                    item={part.recommendation}
                  />
                ),
              )}

              {streaming &&
              index === messages.length - 1 &&
              message.parts.length === 0 ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : null}
            </div>
          </div>
        ))}

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300"
          >
            {error}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
        className="flex items-end gap-2 border-t border-border/60 p-3 sm:p-4"
      >
        <label htmlFor="chat-input" className="sr-only">
          Message the advisor
        </label>
        <textarea
          id="chat-input"
          rows={1}
          value={input}
          disabled={streaming}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter breaks the line.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(input);
            }
          }}
          placeholder="Tell me what you already know and what you want to build…"
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-violet-500/50 disabled:opacity-60"
        />

        {messages.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Start over"
            disabled={streaming}
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
          >
            <RotateCcw className="size-4" aria-hidden />
          </Button>
        ) : null}

        <Button
          type="submit"
          size="icon"
          aria-label="Send"
          disabled={streaming || !input.trim()}
        >
          {streaming ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowUp className="size-4" aria-hidden />
          )}
        </Button>
      </form>
    </div>
  );
}
