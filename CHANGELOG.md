# Changelog

## [0.7.0] - Unreleased

### Changed

- **Runtime: Deno → Node.js 24.** `deno.json` / `deno.lock` removed; npm
  scripts are the toolchain (`npm ci`, `npm run dev|build|check|lint`,
  `npm start`). `.nvmrc` and `engines` require Node 24.
- **`package-lock.json` is now committed**, and `.npmrc` sets
  `ignore-scripts=true` so dependency install scripts never run — the same
  protection Deno gave by default (see SECURITY.md).
- **Linting: `deno lint` → ESLint 9** with typescript-eslint and
  eslint-plugin-svelte (`eslint.config.js`).
- **Docker:** multi-stage `node:24-slim` image (`npm ci`, build, prune dev
  dependencies); health check uses Node's `fetch`.
- **`npm start` loads `.env`** via `node --env-file-if-exists=.env`, so the
  production `.env` (also the one the Docker entrypoint writes) is applied.
- **Nocturne & Daylight redesign:** new welcome screen with @-picker,
  three-pane workspace, versions with diff/compare/restore, iterative
  follow-ups, queued changes, element picker, session history, automatic
  day/night theme.

### Fixed

- **Error page showed no message.** `+error.svelte` read `error`/`status`
  props that SvelteKit never passes; it now reads them from `page`.

## [0.6.2] - 2026-06-18

### Fixed

- **Thinking mode completely broken.** The `THINKING_SYSTEM_PROMPT` used `<think>`
  tags but `extractReasoningMiddleware` expected `<think>`. Reasoning output
  ended up inside the generated HTML instead of the thinking panel. Tags now
  aligned.
- **Ollama ignored `OLLAMA_API_BASE` for generation.** Model listing used the
  configured URL, but generation always hit the default localhost. Now uses
  `createOllama({ baseURL })` for both.
- **Monaco editor stopped streaming during generation.** The `executeEdits()`
  replacement from v0.6.1 is silently blocked by Monaco in read-only mode.
  Reverted to `setValue()` which works in all modes.
- **Parallel generations mixed output.** No `AbortController` — a second
  generation while one was running could merge code from both requests. Added
  proper cancellation.
- **Stale preview on regeneration.** Editor and preview kept showing old code
  when starting a new generation because the `$effect` only ran on truthy
  `generatedCode`. Now clears state when regeneration starts.
- **"Don't save" didn't sync preview.** Clicking "Don't save" in the edit-mode
  dialog reverted the editor but left the preview showing the edited version.
  Now flushes immediately.
- **View switched to GenerationView before validation.** Entering an empty
  prompt and clicking Generate showed an empty generation view with no way back.
  Now validates first.
- **Stream errors silently swallowed.** Only `text-delta` and `reasoning-delta`
  stream events were handled; `error` events were ignored. Failed generations
  appeared to succeed. Error events now sent as NDJSON to the frontend.
- **`DISABLED_PROVIDERS` bypassed in generate endpoint.** Clients could force
  disabled providers via the POST `provider` parameter. Now checked
  server-side with a 400 response.
- **`DEFAULT_PROVIDER` env var accepted any string.** Invalid values caused
  cryptic 500 errors. Now validated against the `LLMProvider` enum.
- **Google API key exposed in URL query string.** Moved to `x-goog-api-key`
  header.
- **`Authorization: Bearer null` for Mistral/Cerebras.** Missing API key
  produced a misleading auth header. Now validated before the request.
- **Cloud provider `*_API_BASE` env vars documented but never used.**
  `DEEPSEEK_API_BASE`, `ANTHROPIC_API_BASE`, etc. were in `.env.example` and
  README but never passed to the SDK. All six cloud providers now pass
  `baseURL` from config.
- **API keys fell back to empty string.** Missing keys silently produced
  generic provider errors. Now throws a clear "API key not configured" message.
- **Two Monaco instances mounted simultaneously.** Mobile and desktop panels
  were both in the DOM (CSS hidden). Now conditionally rendered, halving
  memory usage.
- **Race condition on model loading.** Switching providers quickly could
  overwrite the correct model list with a stale response. Fixed with
  cancellation tracking.
- **SessionStorage cache crash.** `JSON.parse` without try/catch could crash
  on corrupt data. Now catches and clears cache on error.
- **Custom system prompt empty silently fell back to default.** Selecting
  "Custom" with an empty textarea ran the default prompt. Now shows a
  validation error.
- **Monaco auto-scrolled to end during streaming.** User scroll position was
  constantly reset. Now tracks if the user has scrolled away and skips
  auto-scroll.
- **No error boundary.** Unhandled errors showed a generic technical message.
  Added `+error.svelte` with a styled dark-theme error page.
- **Preview iframe race conditions.** Swap timeouts and fade-out timers were
  not cleaned up on unmount. Added `onDestroy` cleanup.
- **WorkSteps progress indicators unreliable.** Simple `includes()` string
  matching caused steps to jump or stick. Replaced with regex-boundary
  detectors.

### Security

- **API endpoints had no input validation or rate limiting.** Prompt length,
  `maxTokens`, and `systemPromptType` are now validated server-side.
- **Error details leaked to client.** 500 errors returned internal
  provider/network details. Now returns a generic message; 400 validation
  errors remain specific.
- **Iframe sandbox tightened.** Removed `allow-popups` and `allow-modals`
  from preview sandbox. `allow-same-origin` kept (required for scroll sync
  between double-buffered iframes).
- **Docker container ran as root.** Added non-root `USER appuser` and
  `HEALTHCHECK` instruction. Replaced `git clone` with `COPY` so local builds
  actually use local code.

### Changed

- **Restart button resets state** instead of `window.location.reload()`.
  Prompt, provider, and model selections are preserved.
- **Loading screen waits for fonts** (`document.fonts.ready`) instead of a
  fixed 1250ms timeout.
- **`stripFences()` runs once at stream end** instead of on every chunk,
  preventing mid-stream HTML corruption from incomplete markdown fences.
- **Legacy plain-text stream fallback.** If NDJSON parsing fails, raw lines
  are now treated as text content instead of being silently dropped.
- **Monaco `syncEditorContent` calls on init.** Code that arrives while Monaco
  is loading is now picked up after initialization.
- **Dialog only closes via explicit buttons.** Escape and backdrop click no
  longer close the save confirmation dialog accidentally.
- **Removed duplicate `SYSTEM_PROMPT`** in `provider.ts`; centralized in
  `prompts.ts`.
- **ESLint script removed** (was broken — no eslint in dependencies). Added
  `deno lint` task to `deno.json`.
- **Docker default provider unified to `ollama`** across `.env.example`,
  `docker-compose.yml`, and `Dockerfile`.

### Added

- **`.dockerignore`** — excludes `node_modules`, `.git`, `.svelte-kit`,
  `build`, markdown files, and env files from Docker build context.
- **Complete `.env.example`** — all `*_API_BASE` variables, `PORT`, `HOST`,
  and `BODY_SIZE_LIMIT` now documented with commented-out defaults.
- **`.gitignore` gaps filled** — `.DS_Store`, `.env.production`,
  `.env.*.local`, `deno.lock.bak`.

### Removed

- **Tailwind leftovers from React migration** — unused accordion keyframes
  (`--radix-accordion-content-height`), `neon.green` color token (was white,
  not used), `.tech-button` CSS class.
- **Duplicate Roboto font import** in `app.css` (Inter and Space Mono already
  loaded in `app.html`).

---

## [0.6.1] - 2026-06-17

### Improved Live Preview

The Live Preview architecture has been completely overhauled to deliver a flawlessly smooth, professional "morphing" experience while streaming AI-generated code, explicitly addressing the chaotic edge cases of modern CSS and Vanilla JS SPAs.

- **Zero-Flicker Crossfading**: Re-engineered the double-buffering iframe system to use manual `z-index` and `opacity` orchestration. Old frames now remain securely solid in the background while new frames fade in on top, completely eliminating the jarring transparent "alpha dip" flashes during live generation.
- **True JavaScript Re-initialization**: The "Restart" button now forces a legitimate browser-level hard reload of the iframe's DOM and JavaScript environment (by injecting a dynamic `srcdoc` signature), allowing Vanilla JS SPAs to fully reset their routing state.
- **Scroll Sync Stability**: Overrode glitchy double-buffering scroll jumps by strictly enforcing `behavior: 'instant'` during iframe synchronization. This natively overrides any rogue `scroll-behavior: smooth` CSS generated by the LLM.
- **Fast-Forward CSS Injection**: During live code streaming, all CSS animations and transitions are dynamically fast-forwarded to `0.001s`. This prevents bottom-heavy entrance animations (like `opacity: 0` fade-ins) from trapping elements in an invisible loop as the preview continuously updates, allowing content to snap into view instantly and animate gracefully once generation finishes.
- **Non-Destructive SPA Routing**: The preview's injected click-interceptor now intelligently handles hash fragment navigation. It effectively patches browser `srcdoc` limitations without aggressively overwriting Vanilla JS router behavior.

## [0.6.0] - 2026-06-15

### ⚠ Breaking — Complete Framework Rewrite

This release replaces the entire Next.js / React stack with **SvelteKit + Svelte
5** and moves the runtime and toolchain to **Deno 2**. The application's
behaviour, feature set, and all 9 AI provider integrations are preserved
exactly. Only the implementation technology changes.

#### Why Svelte instead of React?

- **No virtual DOM.** Svelte compiles components to direct DOM instructions at
  build time. The app's hot path — streaming NDJSON into a live preview while
  updating a Monaco editor — involves thousands of incremental state mutations
  per generation. Svelte's compiled output handles this with far less runtime
  overhead than React's reconciler.
- **Runes replace hooks.** Svelte 5's `$state` / `$derived` / `$effect` runes
  are fine-grained reactive primitives — no dependency arrays, no stale-closure
  bugs, no `useCallback`/`useMemo` boilerplate. The entire generation state
  module (`useCodeGeneration`) became a single class with reactive fields.
- **Smaller output.** The Svelte runtime is ~10 KB. React 19 + ReactDOM is ~130
  KB before any application code. For a tool that should feel instant, that gap
  matters.
- **No "use client" / "use server" boundary friction.** SvelteKit's file
  conventions (`+server.ts`, `$lib/server/`) express the same server/client
  split more clearly and with fewer footguns than Next.js App Router.
- **Shadcn/Radix replaced by hand-rolled primitives.** The original project used
  ~50 Radix/Shadcn components but only a dozen in practice. The new UI layer is
  ~300 lines of Svelte with zero external component library dependencies, making
  the dependency tree significantly smaller and auditable.

#### Why Deno instead of Node/npm?

- **Security by default.** Deno requires explicit permission flags
  (`--allow-net`, `--allow-read`, etc.) and does **not** run npm lifecycle
  scripts unless explicitly opted in. This directly mitigated the
  `ai-sdk-ollama@2.2.1` supply-chain worm discovered during this migration (see
  SECURITY.md).
- **No npm needed.** `deno install` reads `package.json` and resolves the
  dependency tree without requiring a separate runtime install. One tool for
  everything.
- **Built-in formatter and linter.** `deno fmt` and `deno lint` replace ESLint +
  Prettier with zero config, keeping the toolchain surface small.
- **First-class TypeScript.** Deno runs TypeScript natively; no `ts-node`,
  `tsx`, or transpile-before-run dance.
- **`deno.json` tasks.** `deno task dev/build/check` replace npm scripts with
  reproducible, self-documenting commands.

### Changes

#### Runtime and toolchain

- **Deno 2** replaces Node.js / npm as the runtime and package manager.
- `deno.json` added with `dev`, `build`, `start`, `preview`, and `check` tasks.
- `nodeModulesDir: "auto"` in `deno.json` enables a real `node_modules` tree so
  Vite and SvelteKit work without modification.
- `package.json` retained for dependency declarations; `deno install` manages
  it.
- `deno.lock` committed for reproducible installs.
- Dockerfile rebuilt on the official `denoland/deno:2.8.3` image; production
  server started with `deno run -A build/index.js`.

#### Framework

- **Next.js 15 → SvelteKit 2** (Svelte 5, adapter-node).
- `app/` directory and all `*.tsx` files removed.
- `components/` and `lib/` (Next.js / React versions) removed.
- `src/routes/` replaces `app/` for pages and API endpoints.
- `src/lib/` replaces `@/*` path alias.
- `export const ssr = false` in `+layout.ts` — app renders client-side (Monaco,
  sessionStorage, streaming fetch require browser APIs).

#### API routes

- `app/api/generate-code/route.ts` → `src/routes/api/generate-code/+server.ts`
- `app/api/get-models/route.ts` → `src/routes/api/get-models/+server.ts`
- `app/api/get-default-provider/route.ts` →
  `src/routes/api/get-default-provider/+server.ts`
- All three preserved exactly — same request/response contract, same NDJSON
  streaming format.

#### Provider system

- `lib/providers/` → `src/lib/server/providers/` (SvelteKit server-only
  boundary).
- `process.env` replaced with `$env/dynamic/private` — secrets are guaranteed
  never to reach the client bundle.

#### State management

- `hooks/use-code-generation.ts` (React hook) →
  `src/lib/state/code-generation.svelte.ts` (Svelte 5 rune class).
- All `useState` / `useEffect` patterns replaced with `$state` / `$effect`.

#### Components

| Old (React/Next.js)                 | New (Svelte 5)                                                |
| ----------------------------------- | ------------------------------------------------------------- |
| `components/loading-screen.tsx`     | `src/lib/components/LoadingScreen.svelte`                     |
| `components/welcome-view.tsx`       | `src/lib/components/WelcomeView.svelte`                       |
| `components/provider-selector.tsx`  | `src/lib/components/ProviderSelector.svelte`                  |
| `components/generation-view.tsx`    | `src/lib/components/GenerationView.svelte`                    |
| `components/generation-panels.tsx`  | `src/lib/components/CodePanel.svelte` + `PreviewPanel.svelte` |
| `components/code-editor.tsx`        | `src/lib/components/CodeEditor.svelte`                        |
| `components/thinking-indicator.tsx` | `src/lib/components/ThinkingIndicator.svelte`                 |
| `components/work-steps.tsx`         | `src/lib/components/WorkSteps.svelte`                         |
| `components/ui/` (~50 Radix/Shadcn) | `src/lib/components/ui/` (8 hand-rolled)                      |

#### Dependencies replaced

| Removed                                                                                   | Replaced by                                                  |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `next`, `react`, `react-dom`                                                              | `@sveltejs/kit`, `svelte`, `vite`                            |
| `@monaco-editor/react`                                                                    | `monaco-editor` (direct, via `onMount`)                      |
| `react-resizable-panels`                                                                  | `paneforge`                                                  |
| `sonner`                                                                                  | `svelte-sonner`                                              |
| `lodash.debounce`                                                                         | inline debounce (5 lines)                                    |
| `next-themes`                                                                             | `class="dark"` on `<html>` in `app.html`                     |
| `lucide-react`                                                                            | `@lucide/svelte` (also fixes the deprecated `lucide-svelte`) |
| All `@radix-ui/*`, `cmdk`, `class-variance-authority`, `react-hook-form`, `zod` (UI only) | removed entirely                                             |

#### Assets

- `public/` → `static/` (SvelteKit convention).
- `app/globals.css` → `src/app.css`.
- Global animations (`glitch`, `typing`, `pulse-slow`) moved from `styled-jsx`
  blocks into `src/app.css`.
- `next.config.mjs`, `components.json`, `vercel.json` removed.
- `postcss.config.mjs` → `postcss.config.js`.
- Custom `favicon.svg` added.

### Security

- **`ai-sdk-ollama@2.2.1` supply-chain worm mitigated.** The previous `^2.2.0`
  range could resolve to the compromised `2.2.1` build (published 2026-06-04).
  The dependency is now pinned to `2.2.0` via both `dependencies` and an npm
  `overrides` entry. `SECURITY.md` added with full advisory and remediation
  instructions.
- **`lucide-svelte` deprecated.** Migrated to the maintained `@lucide/svelte`
  package.

---

## [0.5.2] - 2026-03-16

### Performance

- **Monaco Editor lazy-loading** — Loaded via dynamic import instead of a static
  import, removing ~2 MB from the initial JS bundle.
- **Streaming optimizations** — Replaced O(n²) string concatenation with
  array-based accumulation. State updates batched once per `reader.read()` call.
  Single `TextDecoder` instance reused per stream.
- **Preview debounce increased** — Raised from 50 ms to 200 ms, reducing
  re-render frequency during fast streaming.
- **WorkSteps refactored to `useMemo`** — Eliminated one extra render cycle per
  code update.
- **Model list cached in `sessionStorage`** — Switching back to a previously
  loaded provider skips the network request entirely.
- **Mobile tab switching uses CSS visibility** — Prevents Monaco from
  re-initializing on every tab switch.
- **Replaced full `lodash` with `lodash.debounce`** — Saved ~54 KB from the
  client bundle.
- **Tailwind content paths narrowed** — Only actual source directories scanned,
  speeding up CSS builds.

### Fixes

- **OpenRouter model selector lag** — Model selector is now a memoised
  component, preventing re-renders when unrelated parent state (e.g. `prompt`)
  changes.
- **Model selector rebuilt as Combobox** — Replaced Radix `Select` with a
  Popover + cmdk Command, fixing search-bar scroll-away and focus-loss bugs.
- **Model selector hover / color regression** — Corrected `hover:bg-accent`
  resolving to pure white.

## [0.5.1] - 2026-01-05

### Fixes

- **Fixed Ollama provider crash** — Replaced `ollama-ai-provider` with
  `ai-sdk-ollama@^2.2.0` for AI SDK v5 compatibility.

## [0.5.0] - 2025-12-22

### Major Changes

#### Vercel AI SDK Migration

- **Migrated from `openai` SDK to Vercel AI SDK** (`ai` package)
- Using official SDK packages for all providers:
  - `@ai-sdk/deepseek`, `@ai-sdk/anthropic`, `@ai-sdk/google`,
    `@ai-sdk/mistral`, `@ai-sdk/cerebras`
  - `@openrouter/ai-sdk-provider`, `ollama-ai-provider`,
    `@ai-sdk/openai-compatible`
- Unified streaming via `streamText()` and `fullStream` API

#### Universal Reasoning Support

- **Native reasoning models** now fully supported (e.g., `deepseek-reasoner`,
  `o1`)
  - SDK automatically extracts `reasoning_content` from API responses
  - Reasoning streamed as `reasoning-delta` chunks
- **Tag-based reasoning fallback** for models using `<think>` tags
  - Implemented via `extractReasoningMiddleware` with `wrapLanguageModel()`
- Backend now sends NDJSON stream with separate `text` and `reasoning` types
- Frontend parses unified stream format for both reasoning methods

### Refactor

- `lib/providers/provider.ts`: Complete rewrite using official SDK providers
- `app/api/generate-code/route.ts`: Custom `fullStream` handler for text +
  reasoning
- `hooks/use-code-generation.ts`: NDJSON parsing replaces manual `<think>` tag
  extraction
- OpenRouter `getModels()` now fetches all available models from API (400+)

### New Features

- **OpenRouter as dedicated provider** with own API key (`OPENROUTER_API_KEY`)
- **4 new official providers**: Anthropic, Google AI (Gemini), Mistral, Cerebras
- **`DISABLED_PROVIDERS` env var** to disable providers via comma-separated list

### Notes

- Provider packages still return `LanguageModelV1` (v4 API) while main SDK is v5
- Type casts can be removed when provider packages release v5-compatible updates

## [0.4.0] - 2025-12-15

### Refactor

- Centralized generation logic into custom `useCodeGeneration` hook.
- Modularised `GenerationView` into reusable components for cleaner
  architecture.

### Security

- Updated Next.js to patch critical vulnerabilities (including React2Shell).

### Fixes

- Improved Ollama stream parsing (added buffering) to prevent crashes on split
  JSON chunks.

### Chore

- Centralized system prompt management in the backend.
- Removed unused Shadcn UI components and dependencies.
