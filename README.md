> **What's new?** See the [Changelog](./CHANGELOG.md) for details.

> [!CAUTION]
> This project is developed and maintained using **Agentic Engineering** — with the assistance of **Claude Opus 4.6** by Anthropic. Code, architecture decisions, and documentation in this repository are largely produced through AI-assisted development workflows.

A modern web application that uses AI to generate HTML, CSS, and JavaScript code based on natural language prompts. Simply describe what you want to build, and the AI will create a complete, self-contained web page for you.

## Features

- **AI-Powered Code Generation**: Generate complete web pages from text descriptions
- **Live Preview**: See your generated code in action with desktop, tablet, and mobile views
- **Code Editing**: Edit the generated code directly in the browser
- **Multiple AI Providers**: Support for DeepSeek, custom OpenAI-compatible APIs, and local models
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, dark-themed interface with a focus on usability

## Tech Stack

- [Next.js 15](https://nextjs.org/) with App Router
- [React 19](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [OpenAI SDK](https://github.com/openai/openai-node) (for API compatibility)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.17 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Ollama](https://ollama.com/download/) or [LM Studio](https://lmstudio.ai/) installed 
- OR an API key from one of the supported providers (see below)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/weise25/LocalSite-ai.git
   cd LocalSite-ai
   ```

2. Install the dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Rename the `.env.example` file in the root directory to `.env.local` and add your API key:
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
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

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

1. Visit [Cerebras](https://cloud.cerebras.ai/) and create an account or sign in.
2. Navigate to the API keys section.
3. Create a new API key and copy it.
4. Set in your `.env.local` file:
   ```
   CEREBRAS_API_KEY=your_cerebras_api_key
   ```

#### Google Gemini

1. Visit [Google AI Studio](https://aistudio.google.com) and create an account or sign in.
2. Navigate to the API keys section.
3. Create a new API key and copy it.
4. Set in your `.env.local` file:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
   ```
#### Anthropic Claude

1. Visit [Anthropic](https://console.anthropic.com) and create an account or sign in.
2. Navigate to the API keys section.
3. Create a new API key and copy it.
4. Set in your `.env.local` file:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

### DeepSeek

1. Visit [DeepSeek](https://platform.deepseek.com) and create an account or sign in.
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

1. Visit [Mistral AI Studio](https://console.mistral.ai/) and create an account or sign in.
2. Navigate to the API keys section.
3. Create a new API key and copy it.
4. Set in your `.env.local` file:
   ```
   MISTRAL_API_KEY=your_mistral_api_key
   ```

### Custom OpenAI-compatible API

You can use any OpenAI-compatible API:

1. Obtain an API key from your desired provider (OpenAI, Together AI, Groq, etc.).
2. Set in your `.env.local` file:
   ```
   OPENAI_COMPATIBLE_API_KEY=your_api_key
   OPENAI_COMPATIBLE_API_BASE=https://api.of.provider.com/v1
   ```

If your OpenAI-compatible provider does not support listing available models (some third-party or self-hosted providers), you can explicitly set a single model ID to use with the `OPENAI_COMPATIBLE_MODEL` environment variable. When set, the app will return this model instead of attempting to call the provider's models.list endpoint.

Example `.env.local`:
```
OPENAI_COMPATIBLE_API_KEY=your_api_key
OPENAI_COMPATIBLE_API_BASE=https://api.of.provider.com/v1
OPENAI_COMPATIBLE_MODEL=gpt-4o-mini
```

## Deployment

### Deploying on Vercel

[Vercel](https://vercel.com) is the recommended platform for hosting your Next.js application:

1. Create an account on Vercel and connect it to your GitHub account.
2. Import your repository.
3. Add the environment variables for your desired provider, e.g.:
   - `DEEPSEEK_API_KEY`
   - `DEEPSEEK_API_BASE`
   - `DEFAULT_PROVIDER`
4. Click "Deploy".

### Other Hosting Options

The application can also be deployed on:
- [Netlify](https://netlify.com)
- [Cloudflare Pages](https://pages.cloudflare.com)
- Any platform that supports Next.js applications

**Keep in Mind that if you host it on a platform, (like Vercel, Netlify, etc.) you can not use local models through Ollama or LM Studio, unless using something like Tunneling via [ngrok](https://ngrok.com).**

## Usage

1. Enter a prompt describing what kind of website you want to create.
2. Select an AI provider and model from the dropdown menu.
3. Click "GENERATE".
4. Wait for the code to be generated.
5. View the live preview and adjust the viewport (Desktop, Tablet, Mobile).
6. Toggle edit mode to modify the code if needed.
7. Copy the code or download it as an HTML file.

## Roadmap

### AI Models and Providers
- [x] Integration with [Ollama](https://ollama.ai) for local model execution
- [x] Support for [LM Studio](https://lmstudio.ai) to use local models
- [x] Predefined provider: DeepSeek
- [x] Custom OpenAI-compatible API support
- [x] Support thinking models (Qwen3,DeepCoder, etc.)
- [x] Adding more predefined providers (Anthropic, Groq, etc.)

### Advanced Code Generation
- [ ] Choose between different Frameworks and Libraries (React, Vue, Angular, etc.)
- [ ] File-based code generation (multiple files)
- [ ] Save and load projects
- [ ] Agentic diff-editing capabilities

### UI/UX Improvements
- [ ] Dark/Light theme toggle
- [ ] Customizable code editor settings
- [ ] Drag-and-drop interface for UI components
- [ ] History of generated code

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

