# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

A web app that recognizes ingredients from a fridge photo and recommends recipes, built in three stages
documented in [PRD_step1.md](PRD_step1.md), [PRD_step2.md](PRD_step2.md), and [PRD_step3.md](PRD_step3.md):

1. Upload a fridge photo → recognize ingredients via OpenRouter (`google/gemma-4-26b-a4b-it:free`, vision)
2. Generate recipes from the recognized ingredients via the same model (text-only)
3. User accounts (email/password) + saving recipes to a per-user list

Stack: Next.js 16 (App Router, TypeScript, Tailwind CSS v4), Prisma 7 + SQLite (via `@libsql/client`) for
storage. Route Handlers under `src/app/api/*/route.ts` call OpenRouter server-side so `OPENROUTER_API_KEY`
never reaches the client.

## Commands

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`)
- `npx prisma migrate dev --name <description>` — create/apply a migration after editing
  `prisma/schema.prisma`
- `npx prisma generate` — regenerate the Prisma Client into `src/generated/prisma` (gitignored; run this
  after cloning the repo or changing the schema, `migrate dev` also runs it automatically)
- `npx prisma studio` — browse the local SQLite database

No test runner is configured yet.

## Environment variables

- `OPENROUTER_API_KEY` holds an OpenRouter API key. Next.js loads it from `.env` / `.env.local`
  automatically; both are gitignored (`.gitignore` blocks `.env` and `.env*.local`) — never commit either.
- `DATABASE_URL` points at the local SQLite file, `file:./prisma/dev.db`. The db file itself
  (`prisma/dev.db`, contains real user emails/password hashes once the app is used) is gitignored.
- `.env.example` documents the expected variable names without real values.
- Only read secrets in server-side code (Route Handlers, server components) — never prefix them with
  `NEXT_PUBLIC_` and never pass them to client components.

## Auth & data model

- `prisma/schema.prisma` defines `User`, `Session`, `SavedRecipe`. `SavedRecipe` stores
  `ingredients`/`missingIngredients`/`steps` as JSON-stringified arrays (SQLite has no native scalar-list
  type).
- `src/lib/auth.ts` implements session-cookie auth from scratch (bcrypt password hashing, a random
  128-bit token stored in the `Session` table, an httpOnly/`sameSite=lax` cookie named `session_token`).
  No third-party auth library — this was a deliberate MVP choice, not a constraint; revisit if the app
  needs OAuth/social login.
- `getCurrentUser()` in `src/lib/auth.ts` is the single source of truth for "who's logged in" — call it
  from Server Components/Route Handlers rather than re-deriving auth state.
- `src/app/layout.tsx` is an async Server Component that resolves the current user once and passes the
  email down to `src/components/Nav.tsx`; don't re-fetch `/api/auth/me` from the client for nav state.

## Prisma 7 / this environment — gotchas

Prisma 7 changed enough (vs. older Prisma versions) that its `prisma init` bundled reference docs at
`.agents/skills/prisma-*/SKILL.md` (also symlinked under `.claude/skills/`, `.windsurf/skills/`) — check
those before making schema/client changes, since APIs may differ from older training data. Key points
already applied here:

- `generator client { provider = "prisma-client" }` (not the old `prisma-client-js`) generates into an
  explicit `output` path (`src/generated/prisma`, gitignored) instead of `node_modules`.
- The datasource `url` lives in `prisma.config.ts` (reads `DATABASE_URL` via `dotenv/config`), not in
  `schema.prisma`'s `datasource` block.
- Prisma Client now requires an explicit driver adapter. **This project uses `@prisma/adapter-libsql` +
  `@libsql/client`, not the more commonly documented `@prisma/adapter-better-sqlite3`** — `better-sqlite3`
  needs a native build step (`node-gyp rebuild`) that this environment's npm install-scripts policy
  blocks, so it never produces a working binary here. `@libsql/client` ships prebuilt platform binaries as
  regular optional dependencies (no install script required) and works the same way for a local SQLite
  file. If `better-sqlite3` ever seems worth revisiting, confirm native builds actually work in the target
  environment first.
- Client construction lives in `src/lib/db.ts` — reuse the exported `prisma` singleton rather than
  constructing new `PrismaClient` instances (each one opens its own connection).

## OpenRouter integration notes

Learned from manual API testing before this app existed; apply these when writing the Route Handlers:

- Endpoint: `POST https://openrouter.ai/api/v1/chat/completions`, `Authorization: Bearer $OPENROUTER_API_KEY`.
- **Images must be sent as base64 data URIs** (`data:image/<mime>;base64,...`), not remote `image_url`
  links — OpenRouter's provider failed to fetch images from at least one external host (400 error) during
  testing, while a base64-encoded upload worked reliably.
- The model tends to add explanatory text even when asked for a bare list/JSON. Prompt explicitly for
  "no other text" and defensively parse the response (e.g. extract the first `{...}`/`[...]` block for
  JSON, split on commas/newlines for plain lists) rather than trusting the format strictly.
- When sending Korean text to the API from a shell for manual testing, write the JSON body to a UTF-8
  file first and use `curl --data-binary @file` — embedding Korean directly in a shell command line has
  produced mojibake that the model then misinterpreted.

OpenRouter API를 이용해서 실제 AI 모델이 이미지를 인식하고 레시피를 생성하게 해줘.
매번 실행할때 마다 API가 정확히 작동했는지, AI 모델이 문제없이 실행되었는지를 파악하고,
문제가 있다면 어떤 문제가 있는지를 보고해.