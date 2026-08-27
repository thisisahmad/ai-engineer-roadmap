import "server-only";

import { randomUUID } from "node:crypto";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import type { ChatMessage, MessagePart } from "@/lib/chat/types";

/**
 * Conversation storage.
 *
 * Every query filters on the signed-in user's id rather than trusting a
 * conversation id from the client — an id is guessable enough that ownership
 * has to be checked on the server, not assumed because the client had it.
 */

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: number;
};

/** First user message, trimmed to something that fits a list row. */
function deriveTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 60) return clean || "New conversation";
  return clean.slice(0, 57).trimEnd() + "…";
}

function parseParts(raw: string): MessagePart[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MessagePart[]) : [];
  } catch {
    // A row written by an older shape should not break the whole transcript.
    return [];
  }
}

export async function listConversations(
  limit = 30,
): Promise<ConversationSummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const result = await db.execute({
    sql: `SELECT id, title, updated_at FROM chat_conversations
          WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?`,
    args: [user.id, limit],
  });

  return result.rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    updatedAt: Number(row.updated_at),
  }));
}

/** Null when the conversation does not exist or belongs to someone else. */
export async function loadConversation(
  conversationId: string,
): Promise<{ id: string; title: string; messages: ChatMessage[] } | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const owned = await db.execute({
    sql: "SELECT id, title FROM chat_conversations WHERE id = ? AND user_id = ?",
    args: [conversationId, user.id],
  });
  if (owned.rows.length === 0) return null;

  const rows = await db.execute({
    sql: `SELECT role, parts FROM chat_messages
          WHERE conversation_id = ? ORDER BY position ASC`,
    args: [conversationId],
  });

  return {
    id: conversationId,
    title: String(owned.rows[0].title),
    messages: rows.rows.map((row) => ({
      role: row.role === "user" ? "user" : "assistant",
      parts: parseParts(String(row.parts)),
    })),
  };
}

/**
 * Appends one exchange, creating the conversation on first use.
 *
 * Called after a reply has finished streaming rather than before, so a turn
 * that failed halfway is not stored as though it succeeded.
 */
export async function appendExchange({
  conversationId,
  userMessage,
  assistantMessage,
}: {
  conversationId: string | null;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}): Promise<{ conversationId: string; title: string } | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = Date.now();
  const userText = userMessage.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");

  let id = conversationId;
  let title = deriveTitle(userText);

  if (id) {
    // Ownership check, not a convenience: without it any signed-in user could
    // append to another user's conversation by supplying its id.
    const owned = await db.execute({
      sql: "SELECT title FROM chat_conversations WHERE id = ? AND user_id = ?",
      args: [id, user.id],
    });
    if (owned.rows.length === 0) return null;
    title = String(owned.rows[0].title);
  } else {
    id = randomUUID();
    await db.execute({
      sql: `INSERT INTO chat_conversations (id, user_id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [id, user.id, title, now, now],
    });
  }

  const next = await db.execute({
    sql: "SELECT COALESCE(MAX(position), -1) AS max FROM chat_messages WHERE conversation_id = ?",
    args: [id],
  });
  const start = Number(next.rows[0].max) + 1;

  await db.batch(
    [
      {
        sql: `INSERT INTO chat_messages (id, conversation_id, role, parts, created_at, position)
              VALUES (?, ?, 'user', ?, ?, ?)`,
        args: [randomUUID(), id, JSON.stringify(userMessage.parts), now, start],
      },
      {
        sql: `INSERT INTO chat_messages (id, conversation_id, role, parts, created_at, position)
              VALUES (?, ?, 'assistant', ?, ?, ?)`,
        args: [
          randomUUID(),
          id,
          JSON.stringify(assistantMessage.parts),
          now,
          start + 1,
        ],
      },
      {
        sql: "UPDATE chat_conversations SET updated_at = ? WHERE id = ?",
        args: [now, id],
      },
    ],
    "write",
  );

  return { conversationId: id, title };
}

export async function deleteConversation(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) return false;

  // Messages go with it via ON DELETE CASCADE.
  const result = await db.execute({
    sql: "DELETE FROM chat_conversations WHERE id = ? AND user_id = ?",
    args: [conversationId, user.id],
  });

  return result.rowsAffected > 0;
}
