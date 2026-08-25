# AI Roadmap

Seven career roadmaps for AI engineering, statically generated with Next.js 15 (App Router), TypeScript and Tailwind CSS v4.

Every page is prerendered at build time from typed JSON in `/content`. There is no database, no API routes and no server-side rendering at request time, so the whole site runs inside Vercel's free tier and can be hosted on any static host without modification.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

> **Note on `npm install`** — npm 12 blocks package install scripts by default. This project needs two of them (`sharp` and `unrs-resolver`, both native binaries used by Next.js and ESLint). They are pre-approved in `package.json` under `allowScripts`, so a normal install works. If you ever see them reported as blocked, run `npm install-scripts approve sharp unrs-resolver`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload on port 3000 |
| `npm run build` | Production build; writes a static site to `/out` |
| `npm run preview` | Serves `/out` exactly as a static host would |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

`npm run build` followed by `npm run preview` is the closest local approximation to production — it serves the real exported artifact rather than the dev server.

---

## Project structure

```
app/
  layout.tsx                 Root layout: fonts, metadata, header/footer, skip link
  page.tsx                   Homepage — role comparison table, path grid, ladder
  foundation/page.tsx        Stage 0, shared by all seven paths
  paths/[slug]/page.tsx      One statically generated page per content file
  career-ladder/page.tsx     Junior to AI System Architect
  resources/page.tsx         Cross-path course library
  certifications/page.tsx    Vendor credential comparison
  not-found.tsx              404
  sitemap.ts / robots.ts     Emitted as static sitemap.xml / robots.txt

content/                     Typed JSON — the source of truth for the whole site
  paths/*.json               One file per career path (7)
  foundation.json            Stage 0, shared rather than copied into each path
  career-ladder.json         The five rungs
  resources.json             Grouped course library
  certifications.json        Vendor credentials
  projects.json              Practice projects, tagged by path

components/
  ui/                        shadcn/ui primitives (generated; safe to edit)
  motion/reveal.tsx          Framer Motion wrappers, reduced-motion aware
  three/neural-lattice.tsx   The WebGL hero scene
  three/hero-visual.tsx      Client-only loader for the scene
  site-header.tsx            Sticky nav with mobile sheet
  path-card.tsx              Homepage card
  stage-timeline.tsx         Stage-by-stage timeline with resources
  resource-list.tsx          Link list with source provenance badges

lib/
  content.ts                 Reads and validates /content at build time
  types.ts                   Path, Stage, Resource, Level and library types
  accents.ts                 Per-path accent colours
  site.ts                    Canonical site URL resolution

docs/                        The two source documents the content was built from
```

---

## Content model

Everything the site says lives in `/content` as typed JSON. `lib/content.ts` reads it at build time and validates it — an invalid level, a slug that does not match its filename, or a stage that lost its links all fail `next build` rather than rendering a broken page.

### Where the content came from

Two sources, merged per stage, both preserved:

| Source doc | `source` value | What it is |
| --- | --- | --- |
| `docs/Raw-Sheet-Content.md` | `"team-lead"` | The original team Google Sheet — topic lists and resource labels across 14 tabs |
| `docs/AI-Career-Paths-Website-Content-v2.md` | `"curated"` | The 7-path structure, stage levels, and 2026 course/certification research |

Every resource carries its `source`, and the UI shows it as a badge, so a reader can tell which links came from someone who has done the job here and which came from research. Current split: **356 team-lead, 86 curated**, across 58 path stages plus the 5 foundation stages.

The sheet listed resource *labels* but not URLs. Those were resolved to canonical documentation URLs during the build — **re-verify them before publishing**, as both source docs themselves instruct.

### A path file

`content/paths/ai-engineer.json` is served at `/paths/ai-engineer/`. The filename must match the `slug` field. Add a file and the route, homepage card, comparison table row and sitemap entry all follow — there is nothing to register.

```jsonc
{
  "slug": "ai-engineer",
  "title": "AI Engineer",
  "shortTitle": "AI Engineer",
  "pathLetter": "A",              // cross-reference back into the source doc
  "order": 3,                     // position on the homepage
  "accent": "violet",             // see lib/accents.ts
  "tagline": "Builds production apps using existing models",
  "role": {                       // drives the homepage comparison table
    "whatTheyDo": "Builds products using pre-trained models/LLM APIs",
    "trainsModels": "No",
    "coreFocus": "APIs, RAG, backend, deployment"
  },
  "requiresFoundation": true,
  "stages": [
    {
      "id": "llm-fundamentals-prompting",
      "order": 1,
      "title": "LLM Fundamentals & Prompting",
      "level": "junior",          // junior | mid | senior | architect
      "levelLabel": "Junior",     // verbatim source string, incl. "Junior -> Mid"
      "description": "Tokens, context windows, function calling.",
      "topics": ["Tokens", "Context Window", "Function / Tool Calling"],
      "resources": [
        { "label": "OpenAI Prompting Guide", "url": "...", "source": "curated" },
        { "label": "Claude Prompt Engineering Overview", "url": "...", "source": "team-lead" }
      ]
    }
  ]
}
```

### Two fields worth knowing about

**`levelLabel`** — the source doc uses transitional levels ("Junior → Mid") and "Any" for certification checkpoints, which the four-value `level` union cannot express. `level` is the canonical value used for grouping and colour; `levelLabel` is the string actually displayed.

**`needsOriginalContent`** — marks a stage to be written from production experience rather than linked out. It is set on exactly one stage today: **Agentic AI Engineer, stage 5 (Multi-Agent Orchestration at Scale)**, covering transformers internals, KV cache optimization, agent memory, agent handshake mechanisms, orchestration at scale, microservice vs monolith and queue systems. These topics had zero links in the source sheet.

The stage renders with an amber "Original content — not yet written" callout, so the gap is visible on the site rather than silently empty. `lib/content.ts` permits an empty resource list *only* when this flag is set — so no other stage can quietly lose its links.

To find it:

```bash
grep -rl needsOriginalContent content/paths/
```

### Shared stages

Several stages are the same material across paths (the v2 doc says so explicitly — GenAI and Agentic both share the AI Engineer LLM/RAG stages). Those carry a `sharedWith` array of path slugs and render a "Shared with …" note, rather than pretending to be distinct.

The shared foundation (Stage 0) lives in one file, `content/foundation.json`, and gets its own page at `/foundation/`. All seven paths link to it instead of duplicating ~90 resources seven times.

### Adding an accent colour

Add an entry to `PATH_ACCENTS` in `lib/accents.ts`. The classes are written out in full there because Tailwind scans for complete class strings and cannot see names built from template literals.

---

## Deploying to Vercel

The project needs no `vercel.json`. Vercel detects Next.js, reads `output: "export"` from `next.config.ts`, and serves `/out` from its CDN.

### From the dashboard

1. Push the repository to GitHub, GitLab or Bitbucket.
2. In Vercel, choose **Add New → Project**, and import the repository.
3. Leave every build setting at its default — the framework preset, build command and output directory are all detected.
4. Add an environment variable: `NEXT_PUBLIC_SITE_URL` set to your production domain (for example `https://ai-roadmap.vercel.app`). This is what makes the sitemap, `robots.txt` and Open Graph tags use absolute production URLs. See `.env.example`.
5. Deploy.

### From the CLI

```bash
npm i -g vercel
vercel            # preview deployment
vercel --prod     # production
```

Every push to the default branch redeploys production; every other branch gets a preview URL.

### Free-tier notes

- All 18 routes are static files. There are no Serverless or Edge Function invocations, so the function-execution quota is untouched.
- Image Optimization is disabled (`images.unoptimized: true`) because it is a server feature and cannot run in a static export. Optimize images before committing them, or switch modes as described below.
- Bandwidth is the only meaningful limit on the free tier.

---

## Static export vs. Vercel-hosted SSG

`next.config.ts` sets `output: "export"`, which emits a plain folder of HTML and assets. This keeps the site portable — it will run on Netlify, Cloudflare Pages, GitHub Pages or S3 unchanged.

If you would rather use Vercel's full Next.js support, delete the `output` and `images` lines from `next.config.ts`. You then get `next/image` optimization, ISR, Route Handlers and Middleware. The pages stay statically generated and CDN-served either way, so this costs nothing on the free tier — you only give up portability.

Nothing else in the codebase depends on the choice.

---

## Accessibility and motion

- Every animation is wrapped in a `useReducedMotion` check, and a CSS fallback in `globals.css` catches the rest. With "reduce motion" enabled the site renders its final state immediately, including the hero.
- The WebGL scene is `aria-hidden` decoration and is never on the critical path.
- Ordered content — path stages, career levels — uses `<ol>`, so the sequence survives in a screen reader.
- The role comparison table uses real `<th>` scopes and scrolls inside its own container rather than pushing the page sideways.
- There is a skip link on every page.

## Performance notes

- three.js and `@react-three/drei` sit behind `next/dynamic` with `ssr: false`. They are not in the initial bundle and do not appear in the prerendered HTML — the hero text paints first and the lattice fades in behind it.
- The scene is deliberately cheap: two draw calls, no textures, no shadows, no post-processing, with the device pixel ratio capped and drei's `AdaptiveDpr` reducing resolution if the frame rate sags.
- The lattice geometry is generated from a seeded PRNG, so the shape is identical on every load rather than changing between visits.

---

## Notes

- **No salary data.** The v2 content doc excludes it deliberately, and nothing in `/content` or the UI carries compensation figures.
- **`next-mdx-remote` and `gray-matter` are installed but unused.** The content layer is JSON; nothing imports them. Remove with `npm uninstall next-mdx-remote gray-matter` if you are sure prose sections are not coming back.
- **Link verification.** 182 unique external URLs. Both source docs instruct re-verifying before publishing, and course platforms restructure access often — check them before you ship.
