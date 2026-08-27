"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, RotateCcw } from "lucide-react";

import { RecommendationCard } from "@/components/chat/recommendation-card";
import { Button } from "@/components/ui/button";
import { GREETING } from "@/lib/chat/use-chat";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/chat/types";

/**
 * Transcript and composer, shared by the floating widget and the /chat page.
 *
 * Presentational only — the conversation itself lives in useChat, so the two
 * shells cannot drift apart in behaviour.
 */

const OPENERS = [
  "I can code but cannot pick a path",
  "I like maths — train models or build products?",
  "Web dev, fastest route into AI?",
];

/** Three dots while the model is thinking and nothing has arrived yet. */
function TypingIndicator() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-violet-400/70"
          // Staggered so it reads as a wave rather than three dots pulsing
          // in unison.
          style={{ animationDelay: `${i * 140}ms`, animationDuration: "1s" }}
        />
      ))}
    </span>
  );
}

export function ChatThread({
  messages,
  streaming,
  error,
  ready,
  onSend,
  onReset,
  compact = false,
}: {
  messages: ChatMessage[];
  streaming: boolean;
  error: string | null;
  ready: boolean;
  onSend: (text: string) => void;
  onReset: () => void;
  /** Tighter spacing for the floating widget. */
  compact?: boolean;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  const empty = messages.length === 0;

  function submit() {
    onSend(input);
    setInput("");
  }

  return (
    <>
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto overscroll-contain",
          compact ? "space-y-4 p-4" : "space-y-5 p-4 sm:p-6",
        )}
      >
        {/* Held back until the stored transcript has been read, so a restored
            conversation does not appear after a flash of the greeting. */}
        {ready ? (
          <>
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-2xl bg-white/[0.04] px-4 py-2.5 text-sm leading-relaxed">
                {GREETING}
              </div>
            </div>

            {empty ? (
              <ul className="flex flex-wrap gap-2">
                {OPENERS.map((opener) => (
                  <li key={opener}>
                    <button
                      type="button"
                      onClick={() => onSend(opener)}
                      className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-violet-500/40 hover:text-foreground"
                    >
                      {opener}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
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
                  : // Wider, because an assistant turn can contain cards and a
                    // card squeezed into 85% of the column reads as cramped.
                    "w-full max-w-[95%] bg-white/[0.04]",
              )}
            >
              {/* Parts render in arrival order, so a card sits exactly where
                  the model placed it rather than after all the prose. */}
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
                <TypingIndicator />
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
          submit();
        }}
        className={cn(
          "flex items-end gap-2 border-t border-border/60",
          compact ? "p-3" : "p-3 sm:p-4",
        )}
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
              submit();
            }
          }}
          placeholder="What are you trying to build?"
          className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-violet-500/50 disabled:opacity-60"
        />

        {messages.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Start over"
            onClick={onReset}
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
          <ArrowUp className="size-4" aria-hidden />
        </Button>
      </form>
    </>
  );
}
