import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { buildSystemPrompt } from "@/lib/chat/context";
import { drainBuffer, flushBuffer } from "@/lib/chat/recommendations";

/**
 * Chat endpoint, backed by an Ollama-hosted model over its OpenAI-compatible
 * API.
 *
 * Plain `fetch` rather than the OpenAI SDK: the only call made is
 * `/v1/chat/completions`, and the SDK would add a dependency for one POST plus
 * a stream parser we need to write either way to re-frame the events.
 *
 * The response is Server-Sent Events. Upstream deltas are unwrapped and
 * re-emitted as our own event shape, so the client never has to know the
 * provider's payload format and we can inject an error event mid-stream when
 * something fails after the response has already started.
 */

export const dynamic = "force-dynamic";
// Streams can run longer than the default budget on a slow first token.
export const maxDuration = 60;

const MODEL = process.env.OLLAMA_MODEL ?? "gpt-oss-120b";

/** Caps sized to stop a public endpoint being used as free inference. */
const MAX_MESSAGES = 24;
const MAX_CHARS_PER_MESSAGE = 4000;
const MAX_TOTAL_CHARS = 24000;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        // Blank is allowed through validation and filtered below; see the
        // note there. Rejecting it here wedged whole conversations.
        content: z.string().max(MAX_CHARS_PER_MESSAGE),
      }),
    )
    .min(1)
    .max(MAX_MESSAGES),
});

/**
 * Two limits, because they stop different things.
 *
 * Per session: a lifetime cap on how many messages one conversation may send.
 * This is the one that protects the Ollama endpoint from a single person
 * looping, and it is keyed to a cookie rather than an IP — an office, a
 * university or a mobile carrier shares one IP between many real people, and
 * capping them collectively would lock out everybody after the first user.
 *
 * Per IP: a short burst window, which catches scripted abuse that discards the
 * cookie between requests.
 *
 * Both live in process memory, which is worth being honest about: serverless
 * instances do not share it, so a request landing on a fresh instance starts
 * from zero, and clearing the cookie resets the session count. This raises the
 * cost of abuse rather than making it impossible. Moving the counters to Turso
 * or Vercel Edge Config would make them authoritative; that is a deliberate
 * later step, not an oversight.
 */
const SESSION_COOKIE = "roadmap_chat";
const MAX_PER_SESSION = 20;
/** Sessions idle this long are dropped, so the map cannot grow forever. */
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;

const sessions = new Map<string, { count: number; seenAt: number }>();

const BURST_WINDOW_MS = 60_000;
const MAX_PER_BURST = 12;
const bursts = new Map<string, { count: number; resetAt: number }>();

/** Drops expired entries. Called on write, so there is no timer to leak. */
function sweep(now: number) {
  if (sessions.size < 500) return;
  for (const [key, value] of sessions) {
    if (now - value.seenAt > SESSION_TTL_MS) sessions.delete(key);
  }
}

type LimitVerdict =
  | { ok: true; sessionId: string; isNew: boolean; remaining: number }
  | { ok: false; status: number; error: string; offerQuiz: boolean };

async function checkLimits(): Promise<LimitVerdict> {
  const now = Date.now();

  const store = await headers();
  const ip =
    store.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    store.get("x-real-ip") ??
    "unknown";

  const burst = bursts.get(ip);
  if (!burst || burst.resetAt < now) {
    bursts.set(ip, { count: 1, resetAt: now + BURST_WINDOW_MS });
  } else if (++burst.count > MAX_PER_BURST) {
    return {
      ok: false,
      status: 429,
      error: "That is a lot of messages at once. Wait a minute and try again.",
      // Transient and self-clearing, so the quiz is not the right suggestion.
      offerQuiz: false,
    };
  }

  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  const sessionId = existing ?? randomUUID();

  const session = sessions.get(sessionId) ?? { count: 0, seenAt: now };
  if (session.count >= MAX_PER_SESSION) {
    return {
      ok: false,
      status: 429,
      error: `That is ${MAX_PER_SESSION} messages, which is the limit for one conversation.`,
      offerQuiz: true,
    };
  }

  session.count += 1;
  session.seenAt = now;
  sessions.set(sessionId, session);
  sweep(now);

  return {
    ok: true,
    sessionId,
    isNew: !existing,
    remaining: MAX_PER_SESSION - session.count,
  };
}

const encoder = new TextEncoder();

/** One SSE frame in our own shape, not the provider's. */
function frame(payload: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(request: NextRequest) {
  /*
   * Accept both forms of base URL.
   *
   * `https://ollama.com/v1` is what Ollama documents and what every OpenAI
   * SDK expects, so that is what people paste in. Requiring the bare origin
   * instead produced /v1/v1/chat/completions and a 404 that looked like a
   * broken chatbot rather than a config mistake. Strip a trailing /v1 and
   * append it ourselves, so either form works.
   */
  const baseUrl = process.env.OLLAMA_BASE_URL?.replace(/\/+$/, "").replace(
    /\/v1$/,
    "",
  );
  const apiKey = process.env.OLLAMA_API_KEY;

  if (!baseUrl) {
    // Same posture as the database: say what is missing, keep the detail
    // server-side, and do not pretend the feature is merely busy.
    console.error("[chat] OLLAMA_BASE_URL is not set");
    return NextResponse.json(
      { error: "The advisor is not set up yet.", offerQuiz: true },
      { status: 503 },
    );
  }

  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "That message could not be sent. Try starting a new chat.",
        offerQuiz: false,
      },
      { status: 400 },
    );
  }

  /*
   * Drop blank turns rather than rejecting the request.
   *
   * A client that sends one is not attacking anything — an assistant turn
   * flattens to "" when the model returns only reasoning, or only a
   * recommendation block. Rejecting the whole conversation for it meant one
   * such turn wedged the chat permanently behind "Invalid request".
   */
  const messages = parsed.data.messages.filter(
    (message) => message.content.trim().length > 0,
  );

  if (messages.length === 0) {
    return NextResponse.json(
      { error: "Send a message to get started.", offerQuiz: false },
      { status: 400 },
    );
  }

  const totalChars = messages.reduce((n, m) => n + m.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return NextResponse.json(
      { error: "That conversation is too long. Start a new one." },
      { status: 413 },
    );
  }

  const limit = await checkLimits();
  if (!limit.ok) {
    return NextResponse.json(
      { error: limit.error, offerQuiz: limit.offerQuiz },
      { status: limit.status },
    );
  }

  // The system prompt is rebuilt from /content on every request rather than
  // baked in, so editing a path JSON is enough to change what the model knows.
  const systemPrompt = buildSystemPrompt();

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        // Low, because the job is to route people to real content rather than
        // to write imaginatively. Creativity here shows up as invented courses.
        temperature: 0.3,
        // Generous because gpt-oss bills its reasoning against this budget.
        // Too low and the whole allowance is spent thinking, leaving no
        // content at all — which is what produced blank replies.
        max_tokens: 1200,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });
  } catch (cause) {
    console.error("[chat] upstream unreachable:", cause);
    return NextResponse.json(
      {
        error: "Having trouble reaching the advisor right now.",
        offerQuiz: true,
      },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error(`[chat] upstream ${upstream.status}:`, detail.slice(0, 500));
    return NextResponse.json(
      {
        error: "Having trouble reaching the advisor right now.",
        offerQuiz: true,
      },
      { status: 502 },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      // Model output accumulates here until a recommendation block is either
      // complete or ruled out, so a half-written block is never emitted as
      // prose and never reaches the browser as raw JSON.
      let pending = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by a blank line. Keep the trailing
          // partial frame in the buffer until the rest of it arrives.
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const line = part
              .split("\n")
              .find((l) => l.startsWith("data:"));
            if (!line) continue;

            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;

            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (typeof delta !== "string" || delta.length === 0) continue;

              pending += delta;
              const drained = drainBuffer(pending);
              pending = drained.rest;

              if (drained.text) {
                controller.enqueue(frame({ type: "delta", text: drained.text }));
              }
              for (const recommendation of drained.recommendations) {
                controller.enqueue(
                  frame({ type: "recommendation", recommendation }),
                );
              }
            } catch {
              // A malformed frame is not worth killing the stream over.
            }
          }
        }

        // Anything still buffered is either ordinary trailing text or an
        // unterminated block; flushBuffer keeps the first and drops the second.
        const tail = flushBuffer(pending);
        if (tail) controller.enqueue(frame({ type: "delta", text: tail }));

        controller.enqueue(frame({ type: "done" }));
      } catch (cause) {
        console.error("[chat] stream failed:", cause);
        // The client has partial text already, so tell it in-band rather than
        // just cutting the connection.
        controller.enqueue(
          frame({
            type: "error",
            message: "Having trouble reaching the advisor right now.",
            offerQuiz: true,
          }),
        );
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });

  const response = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Vercel and some proxies buffer streamed responses without this.
      "X-Accel-Buffering": "no",
      // Lets the client show "3 messages left" without a second round trip.
      "X-Chat-Remaining": String(limit.remaining),
    },
  });

  if (limit.isNew) {
    // Not httpOnly on purpose: this identifies a rate-limit bucket, not a
    // user, and carries nothing worth protecting. Session-scoped so it expires
    // with the tab, matching where the transcript lives.
    response.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=${limit.sessionId}; Path=/; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`,
    );
  }

  return response;
}
