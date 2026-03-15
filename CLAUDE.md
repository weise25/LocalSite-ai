# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured.

## Environment Setup

Copy `.env.example` to `.env.local` and populate the relevant API keys. `DEFAULT_PROVIDER` defaults to `ollama`. Use `DISABLED_PROVIDERS` (comma-separated) to hide providers from the UI.

## Architecture

**LocalSite-AI** is a Next.js 15 (App Router) application that generates self-contained HTML/CSS/JS pages from natural language prompts, streamed from one of 9 supported AI providers.

### Data flow

1. User selects a provider/model and enters a prompt in `components/welcome-view.tsx`
2. `hooks/use-code-generation.ts` POSTs to `/api/generate-code`
3. The API route calls `lib/providers/provider.ts → generateCodeStream()`, which uses the Vercel AI SDK's `streamText` under the hood
4. The response is streamed back as **NDJSON** — each line is `{"type":"text"|"reasoning","content":"..."}` — and parsed by the hook
5. `components/generation-view.tsx` renders the live preview (iframe) and Monaco editor side-by-side via `components/generation-panels.tsx`

### Provider system (`lib/providers/`)

- **`config.ts`** — defines the `LLMProviders` enum, per-provider env-var mapping, `isProviderConfigured()`, `getAvailableProviders()`. Providers can be disabled via `DISABLED_PROVIDERS`.
- **`provider.ts`** — one class per provider implementing `LLMProviderClient` (`getModels()`, `getModel()`). `generateCodeStream()` wraps Vercel AI SDK `streamText` and applies `extractReasoningMiddleware` for thinking/reasoning models.
- **`prompts.ts`** — two system prompts: `DEFAULT_SYSTEM_PROMPT` and `THINKING_SYSTEM_PROMPT` (adds `<think>` tags for reasoning models).

### API routes (`app/api/`)

| Route | Purpose |
|---|---|
| `POST /api/generate-code` | Streams NDJSON code + reasoning |
| `GET /api/get-models?provider=<id>` | Returns models list for a provider |
| `POST /api/get-models` | Returns all available (configured) providers |
| `GET /api/get-default-provider` | Returns `DEFAULT_PROVIDER` env value |

### Key hooks

- **`use-code-generation.ts`** — all generation state (`generatedCode`, `isGenerating`, `thinkingOutput`, etc.) and streaming logic lives here.

### UI conventions

- Shadcn UI components are in `components/ui/` (generated, avoid manual edits)
- Theme is forced dark via `ThemeProvider` in `app/layout.tsx`
- Path alias `@/*` maps to the repo root
