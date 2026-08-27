"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";

import { ChatThread } from "@/components/chat/chat-thread";
import { useChat } from "@/lib/chat/use-chat";
import { cn } from "@/lib/utils";

/**
 * Site-wide floating advisor.
 *
 * Deliberately plain CSS — no WebGL, no canvas. It sits on every page, so its
 * cost is paid everywhere; the glow is a blurred gradient behind the panel
 * rather than anything that renders per frame.
 *
 * Hidden on /chat, where the full page already hosts the same conversation
 * from the same sessionStorage key. Two mounted copies would fight over it.
 */
export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { messages, send, reset, streaming, error, ready } = useChat();

  // Escape closes, and focus goes back to the button that opened it rather
  // than to the top of the document.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The mobile sheet covers the page, so the page behind it must not scroll.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    if (mobile) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector("textarea")?.focus();
  }, [open]);

  if (pathname?.startsWith("/chat")) return null;

  const unread = !open && messages.length === 0;

  return (
    <>
      {/* No scrim. The mobile sheet is inset-0 and opaque, so a backdrop
          behind it can never be seen or tapped — it only added a second
          control with the same accessible name as the close button. */}
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Career advisor"
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-card/95 backdrop-blur-xl",
            // Phone: a full-screen sheet. A 360px box with cards inside is
            // unusable, so it takes the whole viewport instead.
            "inset-0 rounded-none border-0",
            // Desktop: a panel anchored above the button.
            "sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(34rem,calc(100dvh-9rem))] sm:w-[26rem]",
            "sm:rounded-2xl sm:border sm:border-violet-500/25",
            "sm:shadow-2xl sm:shadow-violet-950/40",
          )}
        >
          {/* The glow: one blurred gradient, no per-frame work. */}
          <div
            className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-gradient-to-b from-violet-500/25 via-amber-500/10 to-transparent blur-2xl"
            aria-hidden
          />

          <header className="relative flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Which path fits you?</p>
              <p className="truncate text-xs text-muted-foreground">
                Only recommends what is on this site
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="Close chat"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <ChatThread
            compact
            messages={messages}
            streaming={streaming}
            error={error}
            ready={ready}
            onSend={send}
            onReset={reset}
          />
        </div>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close career advisor" : "Open career advisor"}
        className={cn(
          "group fixed bottom-5 right-5 z-50 flex size-13 items-center justify-center rounded-full sm:bottom-6 sm:right-6",
          "border border-violet-500/40 bg-gradient-to-br from-violet-600 to-violet-700",
          "shadow-lg shadow-violet-950/50 transition-transform hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Hidden behind the mobile sheet, which has its own close control.
          open ? "hidden sm:flex" : "flex",
        )}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-violet-500/40 blur-lg transition-opacity group-hover:opacity-100 sm:opacity-70"
          aria-hidden
        />
        <MessageCircle className="relative size-5 text-white" aria-hidden />

        {/* Amber dot, the palette's accent, as a quiet nudge before first use. */}
        {unread ? (
          <span
            className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-background bg-amber-400"
            aria-hidden
          />
        ) : null}
      </button>
    </>
  );
}
