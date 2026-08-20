# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

A web app that recognizes ingredients from a fridge photo and recommends recipes, built in three stages
documented in [PRD_step1.md](PRD_step1.md), [PRD_step2.md](PRD_step2.md), and [PRD_step3.md](PRD_step3.md):

1. Upload a fridge photo → recognize ingredients via OpenRouter (`google/gemma-4-26b-a4b-it:free`, vision)
2. Generate recipes from the recognized ingredients via the same model (text-only)
3. User profiles + saving recipes (backend/DB choice still open — see PRD_step3 "결정 필요 사항")

Stack: Next.js 16 (App Router, TypeScript, Tailwind CSS v4). Route Handlers under `src/app/api/*/route.ts`
call OpenRouter server-side so `OPENROUTER_API_KEY` never reaches the client.

## Commands

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`)

No test runner is configured yet.

## Environment variables

- `OPENROUTER_API_KEY` holds an OpenRouter API key. Next.js loads it from `.env` / `.env.local`
  automatically; both are gitignored (`.gitignore` blocks `.env` and `.env*.local`) — never commit either.
- `.env.example` documents the expected variable name without a real value.
- Only read the key in server-side code (Route Handlers, server components) — never prefix it with
  `NEXT_PUBLIC_` and never pass it to client components.

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
