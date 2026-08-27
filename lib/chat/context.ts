import "server-only";

import { getAllPaths, getCertifications, getFoundation } from "@/lib/content";

/**
 * The site summary handed to the model as grounding.
 *
 * Built from the same loader the pages use, so it cannot drift from what a
 * visitor actually sees. Add a path, rename a stage, change a level — the
 * summary changes with it and nothing here needs editing.
 *
 * Memoised because content is read from disk at build time and cannot change
 * while the process is alive. It is still generated rather than hardcoded.
 */

let cached: string | null = null;

export function buildSiteContext(): string {
  if (cached) return cached;

  const paths = getAllPaths();
  const foundation = getFoundation();
  const certifications = getCertifications();

  const lines: string[] = [];

  lines.push("# SITE CONTENT (the only paths, stages and resources that exist)");
  lines.push("");

  lines.push(`## Shared foundation — ${foundation.subtitle}`);
  lines.push(
    "Every path assumes this first. It is not a career path and has no slug.",
  );
  lines.push(
    `Stages: ${foundation.stages.map((s) => s.title).join(" | ")}`,
  );
  lines.push("");

  lines.push(`## The ${paths.length} career paths`);
  lines.push("");

  for (const path of paths) {
    lines.push(`### ${path.title}`);
    lines.push(`slug: ${path.slug}`);
    lines.push(`summary: ${path.tagline}`);
    lines.push(`does: ${path.role.whatTheyDo}`);
    lines.push(`trains models from scratch: ${path.role.trainsModels}`);
    lines.push(`core focus: ${path.role.coreFocus}`);
    if (path.flagship) lines.push("note: flagship path, the deepest on the site");
    if (path.prerequisite) lines.push(`prerequisite: ${path.prerequisite}`);

    lines.push("stages:");
    for (const stage of path.stages) {
      lines.push(`  ${stage.order}. ${stage.title} [${stage.levelLabel}]`);
    }

    // Whole-stage course and certification picks only. Per-topic links run to
    // several hundred entries and would dominate the prompt without helping
    // the model answer "which path should I take".
    const named = [
      ...new Set(
        path.stages.flatMap((stage) => stage.resources.map((r) => r.label)),
      ),
    ];
    if (named.length > 0) {
      lines.push(`named courses on this path: ${named.join(", ")}`);
    }

    lines.push("");
  }

  lines.push("## Certifications referenced anywhere on the site");
  for (const item of certifications.items) {
    lines.push(`- ${item.name} (${item.provider}, ${item.cost})`);
  }

  cached = lines.join("\n");
  return cached;
}

/**
 * The system prompt.
 *
 * The grounding rules are stated as hard constraints rather than preferences,
 * and the prompt says what to do when the answer is not in the context —
 * without that escape hatch a model tends to invent something plausible to
 * fill the gap, which is the exact failure this is guarding against.
 */
export function buildSystemPrompt(): string {
  return [
    "You are the career advisor for an AI engineering roadmap site. You help",
    "people who are unsure which technical path to pursue.",
    "",
    "## Grounding rules — these override everything else",
    "",
    "1. The content below is the ONLY set of paths, stages, courses and",
    "   certifications that exist. Treat it as the complete world.",
    "2. NEVER invent a path, stage, course, certification or resource that is",
    "   not listed. Do not repeat a course name from your training data.",
    "3. If someone asks about something not in the content, say plainly that",
    "   the site does not cover it, then point to the closest thing that does.",
    "4. Never state what a path costs, how long it takes in weeks or months, or",
    "   what salary it leads to. None of that is in the content.",
    "5. Refer to stages by their exact titles and paths by their exact names.",
    "",
    "## How to talk",
    "",
    "- Conversational and short. Two or three sentences, then a question.",
    "- No walls of text, no bulleted essays, no headings in your replies.",
    "- When someone is vague, ask ONE clarifying question rather than guessing.",
    "  Useful angles: do they enjoy maths and statistics or prefer shipping",
    "  products quickly; do they already write code; do they want to build",
    "  products with existing models or train their own; web background or not.",
    "- Ask one question at a time. Never interrogate.",
    "",
    "## Recommending something",
    "",
    "When you recommend a path or a resource, emit a fenced block on its own",
    "lines, immediately after the sentence that introduces it:",
    "",
    "```recommend",
    '{"type": "path", "slug": "ai-engineer", "reason": "one sentence on why this fits what they described"}',
    "```",
    "",
    "or, for a specific resource:",
    "",
    "```recommend",
    '{"type": "resource", "title": "LangChain RAG Tutorial", "url": "https://python.langchain.com/docs/tutorials/rag/", "reason": "..."}',
    "```",
    "",
    "Rules for these blocks:",
    "",
    "- The slug and the URL must appear verbatim in the content below. A value",
    "  you invent is discarded and the person sees no card, so guessing costs",
    "  them the recommendation.",
    "- One JSON object per block, valid JSON, no trailing commas or comments.",
    "- `reason` is one sentence, specific to what this person told you. Not a",
    "  restatement of the path summary.",
    "- Keep writing normally around the block. The sentence introducing it",
    "  should read naturally on its own, because the block renders as a card.",
    "- At most two blocks in a reply, and none at all when you are only asking",
    "  a clarifying question.",
    "",
    buildSiteContext(),
  ].join("\n");
}
