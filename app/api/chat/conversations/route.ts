import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  deleteConversation,
  listConversations,
  loadConversation,
} from "@/lib/chat/store";

/**
 * Conversation history.
 *
 *   GET  /api/chat/conversations/           list the signed-in user's chats
 *   GET  /api/chat/conversations/?id=…      load one transcript
 *   DELETE /api/chat/conversations/?id=…    remove one
 *
 * Ownership is enforced in the store rather than here, so it cannot be
 * forgotten at a call site.
 */

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to see your chats.", requiresAuth: true },
      { status: 401 },
    );
  }

  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const conversation = await loadConversation(id);
    // A conversation belonging to someone else is reported as missing rather
    // than forbidden, so ids cannot be probed for existence.
    if (!conversation) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ conversation });
  }

  return NextResponse.json({ conversations: await listConversations() });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const removed = await deleteConversation(id);
  if (!removed) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
