import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { buildSystemPrompt } from "@/lib/chat/context";

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
        content: z.string().min(1).max(MAX_CHARS_PER_MESSAGE),
      }),
    )
    .min(1)
    .max(MAX_MESSAGES),
});

/**
 * In-memory throttle, keyed by IP.
 *
 * Honest about its limits: serverless instances do not share memory, so this
 * slows casual abuse rather than stopping a distributed attack. It matters
 * more here than on the auth routes because every request costs inference.
 */
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;

async function rateLimited(): Promise<boolean> {
  const store = await headers();
  const ip =
    store.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    store.get("x-real-ip") ??
    "unknown";

  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

const encoder = new TextEncoder();

/** One SSE frame in our own shape, not the provider's. */
function frame(payload: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(request: NextRequest) {
  const baseUrl = process.env.OLLAMA_BASE_URL?.replace(/\/+$/, "");
  const apiKey = process.env.OLLAMA_API_KEY;

  if (!baseUrl) {
    // Same posture as the database: say what is missing, keep the detail
    // server-side, and do not pretend the feature is merely busy.
    console.error("[chat] OLLAMA_BASE_URL is not set");
    return NextResponse.json(
      { error: "The assistant is not configured yet." },
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
      { error: "Invalid request." },
      { status: 400 },
    );
  }

  const { messages } = parsed.data;

  const totalChars = messages.reduce((n, m) => n + m.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return NextResponse.json(
      { error: "That conversation is too long. Start a new one." },
      { status: 413 },
    );
  }

  if (await rateLimited()) {
    return NextResponse.json(
      { error: "Too many messages. Wait a minute and try again." },
      { status: 429 },
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
        max_tokens: 700,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });
  } catch (cause) {
    console.error("[chat] upstream unreachable:", cause);
    return NextResponse.json(
      { error: "The assistant is unavailable right now." },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error(`[chat] upstream ${upstream.status}:`, detail.slice(0, 500));
    return NextResponse.json(
      { error: "The assistant is unavailable right now." },
      { status: 502 },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
              if (typeof delta === "string" && delta.length > 0) {
                controller.enqueue(frame({ type: "delta", text: delta }));
              }
            } catch {
              // A malformed frame is not worth killing the stream over.
            }
          }
        }

        controller.enqueue(frame({ type: "done" }));
      } catch (cause) {
        console.error("[chat] stream failed:", cause);
        // The client has partial text already, so tell it in-band rather than
        // just cutting the connection.
        controller.enqueue(
          frame({ type: "error", message: "The reply was cut short." }),
        );
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Vercel and some proxies buffer streamed responses without this.
      "X-Accel-Buffering": "no",
    },
  });
}
