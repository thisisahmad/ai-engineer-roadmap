"use client";

import { ChatThread } from "@/components/chat/chat-thread";
import { useChat } from "@/lib/chat/use-chat";

/**
 * The /chat page conversation.
 *
 * Same hook and same thread UI as the floating widget — only the shell
 * differs. They also share one sessionStorage key, so a conversation started
 * in the widget continues here and the reverse.
 */
export function ChatPanel() {
  const { messages, send, reset, streaming, error, ready } = useChat();

  return (
    <div className="flex h-[min(72vh,42rem)] flex-col rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm">
      <ChatThread
        messages={messages}
        streaming={streaming}
        error={error}
        ready={ready}
        onSend={send}
        onReset={reset}
      />
    </div>
  );
}
