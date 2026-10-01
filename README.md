> **What's new?** See the [Changelog](./CHANGELOG.md) for details.

> [!IMPORTANT]
> **Security:** A compromised build of `ai-sdk-ollama@2.2.1` (supply-chain worm,
> 2026-06-04) could be pulled by the old `^2.2.0` range. The dependency is now
> pinned to the safe `2.2.0`. If you installed this project on or after that
> date, see [SECURITY.md](./SECURITY.md) to check and remediate.

> [!CAUTION]
> **v0.7.0 — Back to Node.js:** The runtime moves from Deno to **Node.js 24**
> with npm. The SvelteKit + Svelte 5 code base is unchanged.
>
> **If you are upgrading from v0.6.x:**
>
> 1. Install [Node.js 24](https://nodejs.org/) (or run `nvm use` — the repo
>    ships an `.nvmrc`).
> 2. Pull the latest code, delete `node_modules`, then run `npm ci`.
> 3. Keep your existing `.env.local` (dev) or `.env` (production) — variable
>    names are unchanged.
> 4. Use `npm run dev`, `npm run build` and `npm start` instead of
>    `deno task …`.
> 5. For Docker deployments, rebuild your images (`docker compose up --build`).
>
> See the [Changelog](./CHANGELOG.md) for details.

A modern web application that uses AI to generate HTML, CSS, and JavaScript code
based on natural language prompts. Simply describe what you want to build, and
the AI will create a complete, self-contained web page for you.

## Features

- **AI-Powered Code Generation**: Generate complete web pages from text
  descriptions
- **Live Preview**: See your generated code in action with desktop, tablet, and
  mobile views
- **Code Editing**: Edit the generated code directly in the browser
- **Multiple AI Providers**: Support for DeepSeek, custom OpenAI-compatible
  APIs, and local models
- **Iterate in versions**: Follow-up prompts revise the current page; every
  result is a version you can view, diff, compare side by side or restore
- **Queue and pick**: Queue the next change while one is still writing, or
  pick an element in the preview to aim a change at it
- **History**: Past sessions are kept in your browser and listed in the sidebar
- **Responsive Design**: Works on desktop and mobile devices
- **Nocturne & Daylight**: A night-sky interface after dark and a daylight one
  by day — switched automatically, or pinned with the theme toggle

## Tech Stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5 with runes)
- [Node.js 24](https://nodejs.org/) with npm
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel AI SDK](https://sdk.vercel.ai/) (provider streaming)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 24 or newer (npm is included)
- [Ollama](https://ollama.com/download/) or [LM Studio](https://lmstudio.ai/)
  installed
- OR an API key from one of the supported providers (see below)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/weise25/LocalSite-ai.git
   cd LocalSite-ai
   ```

2. Install the dependencies (exactly as pinned in `package-lock.json`):
   ```bash
   npm ci
   ```
   Dependency install scripts are disabled in `.npmrc` for supply-chain
   safety; nothing in this project needs them.

3. Rename the `.env.example` file in the root directory to `.env.local` and add
   your API key:
   ```
   # Choose one of the following providers:

   # DeepSeek API
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   DEEPSEEK_API_BASE=https://api.deepseek.com/v1

   # Custom OpenAI-compatible API
   # OPENAI_COMPATIBLE_API_KEY=your_api_key_here
   # OPENAI_COMPATIBLE_API_BASE=https://api.openai.com/v1

   # Default Provider (deepseek, openai_compatible, ollama, lm_studio)
   DEFAULT_PROVIDER=lm_studio
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Supported AI Providers

### Local Models

#### Ollama

1. Install [Ollama](https://ollama.ai/) on your local machine.
2. Pull a model like `llama2` or `codellama`.
3. Start the Ollama server.
4. Set in your `.env.local` file:
   ```
   OLLAMA_API_BASE=http://localhost:11434
   DEFAULT_PROVIDER=ollama
   ```

#### LM Studio

1. Install [LM Studio](https://lmstudio.ai/) on your local machine.
2. Download a model and start the local server.
3. Set in your `.env.local` file:
   ```
   LM_STUDIO_API_BASE=http://localhost:1234/v1
   DEFAULT_PROVIDER=lm_studio
   ```

### Cloud Models

#### Cerebras (Create a Website in 3 seconds!)

1. Visit [Cerebras](https://cloud.cerebras.ai/) and create an account or sign
   in.
2. Navigate to the API keys section.
3. Create a new API key and copy it.
4. Set in your `.env.local` file:
   ```
   CEREBRAS_API_KEY=your_cerebras_api_key
   ```

#### Google Gemini

1. Visit [Google AI Studio](https://aistudio.google.com) and create an account
   or sign in.
2. Navigate to the API keys section.
3. Create a new API key and copy it.
4. Set in your `.env.local` file:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
   ```

#### Anthropic Claude

1. Visit [Anthropic](https://console.anthropic.com) and create an account or
   sign in.
2. Navigate to the API keys section.
3. Create a new API key and copy it.
4. Set in your `.env.local` file:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

### DeepSeek

1. Visit [DeepSeek](https://platform.deepseek.com) and create an account or sign
   in.
2. Navigate to the API keys section.
3. Create a new API key and copy it.
4. Set in your `.env.local` file:
   ```
   DEEPSEEK_API_KEY=your_deepseek_api_key
   DEEPSEEK_API_BASE=https://api.deepseek.com/v1
   ```

#### OpenRouter

1. Visit [OpenRouter](https://openrouter.ai) and create an account or sign in.
2. Navigate to the API keys section.
3. Create a new API key and copy it.
4. Set in your `.env.local` file:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

#### Mistral

1. Visit [Mistral AI Studio](https://console.mistral.ai/) and create an account
   or sign in.
2. Navigate to the API keys section.
3. Create a new API key and copy it.
4. Set in your `.env.local` file:
   ```
   MISTRAL_API_KEY=your_mistral_api_key
   ```

### Custom OpenAI-compatible API

You can use any OpenAI-compatible API:

1. Obtain an API key from your desired provider (OpenAI, Together AI, Groq,
   etc.).
2. Set in your `.env.local` file:
   ```
   OPENAI_COMPATIBLE_API_KEY=your_api_key
   OPENAI_COMPATIBLE_API_BASE=https://api.of.provider.com/v1
   ```

If your OpenAI-compatible provider does not support listing available models
(some third-party or self-hosted providers), you can explicitly set a single
model ID to use with the `OPENAI_COMPATIBLE_MODEL` environment variable. When
set, the app will return this model instead of attempting to call the provider's
models.list endpoint.

Example `.env.local`:

```
OPENAI_COMPATIBLE_API_KEY=your_api_key
OPENAI_COMPATIBLE_API_BASE=https://api.of.provider.com/v1
OPENAI_COMPATIBLE_MODEL=gpt-4o-mini
```

## Deployment

This is a SvelteKit app built with `@sveltejs/adapter-node`. `npm run build`
produces a server in `build/`, which you run with:

```bash
npm run build
npm start   # node --env-file-if-exists=.env build — port 3000 (set PORT to override)
```

`npm start` loads a `.env` file next to `package.json` if there is one;
variables already set in the environment take precedence.

### Docker

A `Dockerfile` (multi-stage, `node:24-slim`) and `docker-compose.yml` are
included. With Docker
running:

```bash
docker compose up --build
```

### Other hosting options

- Any host that can run a Node.js 24 process and serve the `adapter-node`
  output
- Swap in a different [SvelteKit adapter](https://svelte.dev/docs/kit/adapters)
  (Vercel, Netlify, Cloudflare) if you prefer a serverless target

**Keep in mind that if you host it on a remote platform you cannot reach local
models through Ollama or LM Studio unless you expose them, e.g. via tunneling
with [ngrok](https://ngrok.com).**

## Usage

1. Describe the website you want to create.
2. Pick a provider and model from the chip below the prompt — or type `@`
   followed by a provider or model name (e.g. `@qw`, `@anthropic/`).
3. Choose a mode (Default, Thinking, Custom system prompt) and an optional
   token limit, then press Generate (⌘/Ctrl + Enter).
4. Watch the reasoning, code and preview stream in; press Esc to stop.
5. Describe changes in the thread to create new versions. Use the crosshair
   to aim a change at one element of the preview.
6. Use Diff, Compare and the version pills to look back; restore any version.
7. Edit the code directly (⌘/Ctrl + S saves a new version) and export it
   (download, copy or open in a new tab).

## Roadmap

### AI Models and Providers

- [x] Integration with [Ollama](https://ollama.ai) for local model execution
- [x] Support for [LM Studio](https://lmstudio.ai) to use local models
- [x] Predefined provider: DeepSeek
- [x] Custom OpenAI-compatible API support
- [x] Support thinking models (Qwen3,DeepCoder, etc.)
- [x] Adding more predefined providers (Anthropic, Groq, etc.)

### Advanced Code Generation

- [ ] Choose between different Frameworks and Libraries (React, Vue, Angular,
      etc.)
- [ ] File-based code generation (multiple files)
- [x] Save and load projects (browser history of sessions)
- [x] Iterative editing of the current version with diffs

### UI/UX Improvements

- [x] Dark/Light theme toggle (Nocturne / Daylight, automatic by time of day)
- [ ] Customizable code editor settings
- [ ] Drag-and-drop interface for UI components
- [x] History of generated code

### Accessibility

- [ ] Transcription and voice input for prompts
- [ ] Anything; feel free to make suggestions

### Desktop App

- [ ] Turning into a cross-platform desktop app (Electron)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
