import type { AccentName } from "@/lib/accents";

/**
 * Shapes shared between the chat route and the browser.
 *
 * Deliberately separate from lib/chat/recommendations.ts, which is
 * `server-only` because it reads content off disk. A client component
 * importing a type from that module would pull the whole server module into
 * the client graph and fail the build, so the contract lives here on its own.
 */

/**
 * A recommendation that has already been validated against real content.
 *
 * Path fields beyond the slug, and the resource title, are filled in
 * server-side from the content rather than taken from the model — so a card
 * cannot show a label the model made up next to a real link.
 */
export type Recommendation =
  | {
      type: "path";
      slug: string;
      title: string;
      tagline: string;
      accent: AccentName;
      stageCount: number;
      reason?: string;
    }
  | { type: "resource"; title: string; url: string; reason?: string };

/** One frame of the SSE stream from POST /api/chat/. */
export type ChatEvent =
  | { type: "delta"; text: string }
  | { type: "recommendation"; recommendation: Recommendation }
  | { type: "error"; message: string }
  | { type: "done" };

/**
 * One piece of an assistant turn.
 *
 * A turn is a list of parts rather than a string plus a list of cards, so a
 * card renders where the model actually put it. Collapsing to text-then-cards
 * loses that: "either of these could work… or, if you would rather ship
 * products…" only reads correctly with a card between the two clauses.
 */
export type MessagePart =
  | { type: "text"; text: string }
  | { type: "recommendation"; recommendation: Recommendation };

export type ChatMessage = {
  role: "user" | "assistant";
  parts: MessagePart[];
};

/** Flattened text of a turn, for sending back as conversation history. */
export function messageText(message: ChatMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}
