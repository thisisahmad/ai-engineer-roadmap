import type { Metadata } from "next";

import { ChatPanel } from "@/components/chat/chat-panel";
import { GridBackdrop } from "@/components/motion/grid-backdrop";
import { getAllPaths } from "@/lib/content";

export const metadata: Metadata = {
  title: "Ask which path fits you",
  description:
    "Describe your background and what you want to build, and get pointed at the AI engineering path that fits — with the stages and resources that go with it.",
  keywords: [
    "which AI career path",
    "AI engineer or ML engineer",
    "AI career advice",
  ],
  alternates: { canonical: "/chat/" },
};

/**
 * Server component wrapper. The panel is the only client code here, so the
 * page itself stays prerendered and the conversation is the sole dynamic part.
 */
export default function ChatPage() {
  const paths = getAllPaths();

  return (
    <div className="relative isolate mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
      <GridBackdrop pattern="dots" bloom="violet" />

      <h1 className="text-balance text-4xl sm:text-5xl">
        Not sure which path?
      </h1>
      <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
        Describe where you are and what you want to build. The advisor only
        knows the {paths.length} paths on this site — it will not invent a
        course or a career track that does not exist here.
      </p>

      <div className="mt-8">
        <ChatPanel />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Answers are generated, so check anything important against the path
        pages themselves. Nothing you type here is saved to your account.
      </p>
    </div>
  );
}
