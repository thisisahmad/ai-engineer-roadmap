# AI Roadmap

Seven career roadmaps for AI engineering, statically generated with Next.js 15 (App Router), TypeScript and Tailwind CSS v4.

Every page is prerendered at build time from typed JSON in `/content`. There is no database, no API routes and no server-side rendering at request time, so the whole site runs inside Vercel's free tier and can be hosted on any static host without modification.

---

## Quick start

```bash
npm install
npm run db:migrate   # applies the schema to your Turso database
npm run dev
```

Open <http://localhost:3000>.

You **do** need a Turso database, including locally. The client uses
`@libsql/client/web`, which speaks HTTP and carries no native binding — that is
what makes it work on Vercel, where a platform-specific `.node` binary cannot be
relied on. The trade is that `file:` URLs are not supported, so create a second
free database for development rather than sharing the production one.

Without the variables the site still builds and every content page works. Only
sign-in, sign-up and the account page degrade, showing "Accounts are temporarily
unavailable" instead of crashing.

> **Note on `npm install`** — npm 12 blocks package install scripts by default. This project needs two of them (`sharp` and `unrs-resolver`, both native binaries used by Next.js and ESLint). They are pre-approved in `package.json` under `allowScripts`, so a normal install works. If you ever see them reported as blocked, run `npm install-scripts approve sharp unrs-resolver`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serves the production build |
| `npm run db:migrate` | Applies `lib/db/schema.sql`. Idempotent — safe to re-run |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

**Building while `npm run dev` is running** corrupts the dev server, because
both own `.next`. It surfaces as `Cannot find module for page: /x` or a missing
webpack chunk, which looks like a source error and is not. Build somewhere else
instead:

```bash
NEXT_DIST_DIR=.next-verify npm run build
```

To exercise the production build locally, the database URL must be explicit —
the app refuses a fallback file in production so a real deploy can never
silently write to disk that is about to vanish:

```bash
TURSO_DATABASE_URL="file:./local.db" npm run start
```

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

Everything is prerendered at build time. There is no server, no database and no
runtime code, so nothing here can exceed a function quota — the only free-tier
limit that applies is bandwidth.

### Connect the repository

1. Push this repository to GitHub.
2. In Vercel choose **Add New → Project** and import it.
3. Leave every build setting at its default. Vercel detects Next.js and reads
   `output: "export"` from `next.config.ts` on its own; the build command and
   output directory do not need overriding.
4. Set one environment variable — see below.
5. Deploy.

Every push to the default branch redeploys production. Every other branch gets
its own preview URL.

### From the CLI instead

```bash
npm i -g vercel
vercel            # preview deployment
vercel --prod     # production
```

### Environment variables

| Variable | Required | What it does |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | yes, incl. locally | Turso HTTP URL. `file:` is not supported |
| `TURSO_AUTH_TOKEN` | with a remote URL | Turso database token |
| `NEXT_PUBLIC_SITE_URL` | for correct SEO | Canonical origin |

**`TURSO_DATABASE_URL`** must point at a Turso database over HTTP. A `file:`
URL is rejected: the native driver that would serve it cannot be relied on in a
serverless deployment, which is exactly the failure this client is built to
avoid.

**`NEXT_PUBLIC_SITE_URL`** — without it the build falls back to
`NEXT_PUBLIC_VERCEL_URL`, which is the **per-deployment** hostname
(`ai-roadmap-a1b2c3.vercel.app`), not your production domain. That would put
deployment-specific URLs into `sitemap.xml`, `robots.txt`, every
`rel="canonical"` and every Open Graph image URL — so search engines would
index a hostname that changes on every push. The site works without it; its
SEO does not.

Set all three in **Project → Settings → Environment Variables** for the
Production environment. `.env.example` documents them.

### Setting up the database

**Via the dashboard (no CLI, works on Windows):**

1. Sign up at <https://app.turso.tech>
2. Create a database
3. From its page, copy the **URL** and **Create Token**

**Via the CLI** — note this needs **WSL on Windows**, and `npm i -g turso`
installs the SQL shell (`tursodb`), not the CLI:

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup
turso db create ai-roadmap

turso db show ai-roadmap --url        # -> TURSO_DATABASE_URL
turso db tokens create ai-roadmap     # -> TURSO_AUTH_TOKEN
```

Then apply the schema to it:

```bash
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:migrate
```

Re-run that after any change to `lib/db/schema.sql`. Every statement is
`IF NOT EXISTS`, so it never destroys existing data.

### vercel.json

`vercel.json` exists for one reason: `Content-Type` on the generated Open
Graph images.

Next writes them to paths with no file extension
(`/paths/ai-engineer/opengraph-image`), and a CDN infers content type from the
extension. Without an explicit header they can be served as
`application/octet-stream`, and Facebook, LinkedIn and Twitter all reject a
share image that is not served as an image. The file pins `image/png` on those
routes.

It also sets `X-Content-Type-Options`, `Referrer-Policy` and
`X-Frame-Options`. `headers()` in `next.config.ts` would be the usual place for
those, but it is a server feature and is ignored under `output: "export"` —
`vercel.json` is the only thing that applies.

---

## SEO

| Artefact | Source | Notes |
| --- | --- | --- |
| `sitemap.xml` | `app/sitemap.ts` | 14 URLs; path entries generated from `content/paths` |
| `robots.txt` | `app/robots.ts` | Allows everything, points at the sitemap |
| Canonical URLs | Per-page `metadata.alternates` | Every route has one |
| Open Graph images | `app/opengraph-image.tsx` and `app/paths/[slug]/opengraph-image.tsx` | 8 PNGs generated at build |
| FAQ rich results | `components/faq-section.tsx` | `FAQPage` JSON-LD on the homepage |

Both metadata routes set `export const dynamic = "force-static"`. They compile
to Route Handlers, which are dynamic by default, and `output: "export"` refuses
to build a dynamic route.

### Open Graph images

`ImageResponse` runs at build time and writes real PNGs to `/out`, so there is
no runtime image service to pay for. Eight are generated: one per path, plus a
site-level card used by every other route.

Two constraints, both from satori, the renderer behind `ImageResponse`:

- **Every element with more than one child needs an explicit `display`.** It
  counts a literal string sitting next to an interpolation as two children, so
  `Path {letter}` fails where `` {`Path ${letter}`} `` does not. Every `div` in
  those two files carries `display: "flex"` rather than relying on remembering
  which ones need it.
- **No external assets.** No `fetch`, no remote fonts, no images. The cards are
  typography and colour only, and there are no radial gradients or filters —
  hence the flat gradient bar instead of a blur.

Editing either file changes nothing until you rebuild.

### Free-tier notes

- All 20 routes and 8 OG images are static files. Zero Serverless or Edge
  Function invocations.
- Image Optimization is off (`images.unoptimized: true`) because it is a server
  feature and cannot run in a static export. Optimize images before committing.
- three.js is never in the initial payload, so it does not count against the
  first load on any page.

---

## Rendering model

The site was a pure static export. Adding accounts removed that: a static
bundle has nowhere to run a Server Action or read a session cookie. What
replaced it is a hybrid, and the split is deliberate.

| Route | Mode | Why |
| --- | --- | --- |
| `/`, `/compare`, `/resources`, `/certifications`, `/career-ladder`, `/foundation`, `/quiz` | Static | Identical for everyone; served from the CDN |
| `/paths/[slug]` | SSG | Prerendered from `/content` at build time |
| `/sign-in`, `/sign-up`, `/account` | Dynamic | Depend on the session |
| `/api/me` | Dynamic | Reads the session cookie |

**Session state is read on the client, not the server.** That looks backwards
and is the single most important decision here. Reading the session inside the
shared header — a server component calling `cookies()` — opts *every page that
renders the header* out of static generation. The first version of this did
exactly that and turned the entire site dynamic, throwing away CDN caching on
content that never varies between visitors.

So `/api/me` serves session and progress, `SessionProvider` fetches it once
after hydration, and the content pages stay static. The cost is one frame where
sign-in state is unknown, which the header covers with a placeholder rather
than by guessing.

---

## Accounts and progress

Stage completion works signed out or signed in:

- **Signed out** — `localStorage`, per browser. No account required to use the
  checklist.
- **Signed in** — the database, via Server Actions, so progress follows the
  account to any device.

Signing in **merges** anonymous localStorage progress into the account, once
per browser. It is a union, never a subtraction: ticking things off before
registering never loses them.

Writes are optimistic. The checkbox flips immediately and rolls back if the
server rejects it, because a checklist that waits on a round trip feels broken.

### Security

- Passwords are hashed with **scrypt** (`N=2^15`, ~32MB, ~65ms per hash).
  scrypt is memory-hard and in Node's standard library, so there is no native
  module to compile — argon2 and bcrypt both pull binaries that are awkward on
  serverless.
- Cost parameters are stored **with** each hash (`scrypt$N$r$p$salt$hash`), so
  raising them later does not invalidate existing passwords.
- Session cookies are `httpOnly`, `Secure` in production, `SameSite=Lax`.
- The database stores only the **SHA-256 of the session token**, never the
  token. A leaked database cannot be replayed as a login.
- Sign-in burns equivalent time on a nonexistent email as on a wrong password,
  so timing does not reveal which addresses are registered.
- Deleting a user cascades to their sessions and progress.

**Rate limiting is in-memory and per-instance.** Serverless instances do not
share memory, so it slows casual credential stuffing rather than stopping a
distributed attack. If this site attracts real abuse, move the counter to a
shared store or put Vercel WAF in front of it.

**Not built yet:** password reset and email verification. Both need an email
provider (Resend, Postmark) wired up. Until then, a forgotten password needs a
manual `password_hash` update.

### Personal data

Sign-up collects name, email and — optionally — a phone number. Phone is
optional on purpose: requiring it is the single largest drop-off point on a
signup form. If you market to these people, that is personal data under GDPR
and similar regimes, so it needs a privacy policy and a deletion route. Neither
exists yet.

---

## Accessibility and motion

- Every animation is wrapped in a `useReducedMotion` check. With reduce-motion
  enabled the site renders its final state immediately, and the hero scene
  renders a single frame with no animation loop.
- Both WebGL scenes are gated behind a real capability probe, sit inside an
  error boundary, and fall back to CSS gradients or a 2D list. Losing WebGL
  costs decoration, never content.
- Ordered content — path stages, career levels — uses `<ol>`, so sequence
  survives in a screen reader.
- Wide tables and the career-ladder strip scroll inside their own containers
  rather than pushing the page sideways.
- The career ladder is a real tablist; progress toggles are real checkboxes.
- There is a skip link on every page.

## Performance notes

- three.js, drei and the postprocessing pass sit behind `next/dynamic` with
  `ssr: false`. They are absent from the initial bundle and from the
  prerendered HTML — hero text paints first and the scene fades in behind it.
- Shared JS is ~99 kB gzipped; the homepage is ~130 kB gzipped including HTML
  and CSS, before the scene loads.
- The hero scene is skipped entirely below 768px and the per-path roadmap graph
  below 1024px, where a 2D fallback renders instead. Bloom is dropped on
  low-power devices, detected via `deviceMemory` and `hardwareConcurrency`.
- Both scenes use seeded PRNGs, so layouts are identical on every load rather
  than changing between visits.
- Fonts are self-hosted through `next/font` with `display: swap`. There are no
  external font requests.

---

## Notes

- **No salary data.** The v2 content doc excludes it deliberately, and nothing
  in `/content` or the UI carries compensation figures.
- **Progress tracking is `localStorage` only.** One key per path, no account,
  no sync. Every read and write is wrapped in `try/catch` — `localStorage`
  throws outright where site data is blocked.
- **The header CTA is a placeholder.** `siteCta` in `lib/site.ts` holds its
  label, href and an `enabled` flag. Point it at the real offering, or set
  `enabled: false` to remove the button.
- **Link verification.** Roughly 180 unique external URLs. Both source docs
  instruct re-verifying before publishing, and course platforms restructure
  access often — check them before you ship.
