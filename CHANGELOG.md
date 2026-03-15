# Changelog

## [0.5.2] - 2026-03-16

### Performance

- **Monaco Editor lazy-loading** — `@monaco-editor/react` is now loaded via `next/dynamic` instead of a static import, removing ~2 MB from the initial JS bundle and unblocking page interactivity on first load.
- **Streaming optimizations** — Replaced O(n²) string concatenation (`buffer += chunk`) with array-based accumulation (`chunks.push()` + `join()`). State updates (`setGeneratedCode`, `setThinkingOutput`) are now batched once per `reader.read()` call instead of on every NDJSON line, reducing unnecessary re-renders during generation. Also reused a single `TextDecoder` instance per stream.
- **Preview debounce increased** — Debounce delay for live preview updates raised from 50 ms to 200 ms, significantly reducing re-render frequency during fast streaming. `prepareHtmlContent` and its `darkModeStyle` constant moved to module scope so they are no longer recreated on every render.
- **WorkSteps refactored to `useMemo`** — Replaced the `useState` + `useEffect` pattern with a single `useMemo`, eliminating one extra render cycle per code update. Step definitions extracted to a module-level constant.
- **Model list cached in `sessionStorage`** — Provider model lists are now cached after the first fetch. Switching back to a previously loaded provider skips the network request entirely.
- **Mobile tab switching uses CSS visibility** — `CodePanel` and `PreviewPanel` are now always mounted in mobile view and toggled via `flex`/`hidden` classes instead of being conditionally rendered. This prevents Monaco Editor from re-initializing on every tab switch.
- **Replaced full `lodash` with `lodash.debounce`** — Dropped the 71 KB `lodash` package in favour of the single-function `lodash.debounce`, saving ~54 KB from the client bundle.
- **Tailwind content paths narrowed** — Removed the broad `*.{js,ts,jsx,tsx,mdx}` root glob from `tailwind.config.ts`; only actual source directories are scanned now, speeding up CSS builds.

### Fixes

- **OpenRouter model selector lag** — With 300+ models, every keystroke in the prompt textarea caused a full reconciliation of all `SelectItem` DOM nodes. The model selector is now a `React.memo` component (`ModelSelector`) with its own isolated state, preventing re-renders when unrelated parent state (e.g. `prompt`) changes.
- **Model selector rebuilt as Combobox** — Replaced the Radix `Select` with a `Popover` + `cmdk` `Command` (the standard Shadcn combobox pattern). This fixes two UI bugs that occurred with the previous inline search input:
  - The search bar no longer scrolls away — `CommandInput` is structurally outside the scrollable `CommandList`.
  - Focus is no longer lost while typing — Radix Select was intercepting keyboard events; `cmdk` manages focus correctly.
  - Search automatically appears when a provider returns more than 10 models and filters by both model name and ID.
- **Model selector hover / color regression** — Corrected `hover:bg-accent` on the trigger button resolving to pure white (`--accent: 0 0% 100%`), which made the button text invisible on hover. Hover styles now keep the button visually identical to its resting state. Fixed `Command` background using the CSS variable `--popover` (near-black) instead of the intended `bg-gray-900`.

## [0.5.1] - 2026-01-05

### Fixes
- **Fixed Ollama provider crash** - Replaced `ollama-ai-provider` with `ai-sdk-ollama@^2.2.0` for AI SDK v5 compatibility

## [0.5.0] - 2025-12-22

### Major Changes

#### Vercel AI SDK Migration
- **Migrated from `openai` SDK to Vercel AI SDK** (`ai` package)
- Using official SDK packages for all providers:
  - `@ai-sdk/deepseek`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/mistral`, `@ai-sdk/cerebras`
  - `@openrouter/ai-sdk-provider`, `ollama-ai-provider`, `@ai-sdk/openai-compatible`
- Unified streaming via `streamText()` and `fullStream` API

#### Universal Reasoning Support
- **Native reasoning models** now fully supported (e.g., `deepseek-reasoner`, `o1`)
  - SDK automatically extracts `reasoning_content` from API responses
  - Reasoning streamed as `reasoning-delta` chunks
- **Tag-based reasoning fallback** for models using `<think>` tags
  - Implemented via `extractReasoningMiddleware` with `wrapLanguageModel()`
- Backend now sends NDJSON stream with separate `text` and `reasoning` types
- Frontend parses unified stream format for both reasoning methods

### Refactor
- `lib/providers/provider.ts`: Complete rewrite using official SDK providers
- `app/api/generate-code/route.ts`: Custom `fullStream` handler for text + reasoning
- `hooks/use-code-generation.ts`: NDJSON parsing replaces manual `<think>` tag extraction
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
- Modularized `GenerationView` into reusable components for cleaner architecture.

### Security
- Updated Next.js to patch critical vulnerabilities (including React2Shell).

### Fixes
- Improved Ollama stream parsing (added buffering) to prevent crashes on split JSON chunks.

### Chore
- Centralized system prompt management in the backend.
- Removed unused Shadcn UI components and dependencies.
