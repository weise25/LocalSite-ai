<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import WelcomeView from '$lib/components/WelcomeView.svelte';
  import GenerationView from '$lib/components/GenerationView.svelte';
  import { CodeGeneration } from '$lib/state/code-generation.svelte';
  import { Session } from '$lib/state/session.svelte';
  import { readJSON, writeJSON } from '$lib/client/storage';

  interface Preferences {
    provider?: string;
    model?: string;
    systemPrompt?: string;
    customSystemPrompt?: string;
    maxTokens?: number;
  }

  // SSR is disabled, so storage is available while the component initialises
  const PREFS_KEY = 'localsite.prefs';
  const prefs = readJSON<Preferences>(PREFS_KEY, {});

  let isLoading = $state(true);
  let showGenerationView = $state(false);

  let prompt = $state('');
  let selectedProvider = $state(prefs.provider ?? '');
  let selectedModel = $state(prefs.model ?? '');
  let selectedSystemPrompt = $state(prefs.systemPrompt ?? 'default');
  let customSystemPrompt = $state(prefs.customSystemPrompt ?? '');
  let maxTokens = $state<number | undefined>(prefs.maxTokens);

  const gen = new CodeGeneration();
  const session = new Session();

  // Remember the last provider, model and mode across visits
  $effect(() => {
    writeJSON(PREFS_KEY, {
      provider: selectedProvider,
      model: selectedModel,
      systemPrompt: selectedSystemPrompt,
      customSystemPrompt,
      maxTokens
    } satisfies Preferences);
  });

  onMount(() => {
    let cancelled = false;

    const fallback = setTimeout(() => {
      if (!cancelled) isLoading = false;
    }, 500);

    void document.fonts.ready.then(() => {
      if (!cancelled) isLoading = false;
    });

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  });

  function validateGenerationInput(): boolean {
    if (!prompt.trim() || !selectedModel || !selectedProvider) {
      toast.error('Please enter a prompt and select a provider and model.');
      return false;
    }
    if (selectedSystemPrompt === 'custom' && !customSystemPrompt.trim()) {
      toast.error('Please enter a custom system prompt.');
      return false;
    }
    return true;
  }

  /** Runs one generation turn and records the result as a version. */
  async function runTurn(text: string) {
    const provider = selectedProvider;
    const model = selectedModel;
    const sessionId = session.id;

    const ok = await gen.generateCode({
      prompt: text,
      model,
      provider,
      maxTokens,
      systemPromptType: selectedSystemPrompt,
      customSystemPrompt
    });

    // The user may have started over while this was running
    if (session.id !== sessionId) return;

    const stopped = !ok && gen.status === 'stopped' && !!gen.generatedCode;
    if (ok || stopped) {
      session.commit({
        prompt: text,
        code: gen.generatedCode,
        durationMs: gen.endedAt - gen.startedAt,
        thinking: gen.thinkingOutput,
        thinkingMs: gen.thinkingStartedAt ? (gen.thinkingEndedAt || gen.endedAt) - gen.thinkingStartedAt : 0,
        stopped,
        provider,
        model
      });
    } else if (gen.status === 'stopped') {
      // Stopped before any code arrived: nothing to keep
      session.endTurn();
      if (session.latest) gen.load(session.latest.code);
    }
  }

  async function handleGenerate() {
    if (!validateGenerationInput()) return;
    session.start(prompt);
    showGenerationView = true;
    await runTurn(prompt);
  }

  async function handleSend(text: string) {
    if (gen.isGenerating) return;
    session.beginTurn(text);
    await runTurn(text);
  }

  async function handleRetry() {
    const text = session.pendingPrompt;
    if (!text || gen.isGenerating) return;
    await runTurn(text);
  }

  function handleStop() {
    gen.stop();
  }

  function handleSaveEdit(code: string) {
    session.commit({ prompt: '', code, manual: true, provider: selectedProvider, model: selectedModel });
    gen.load(code);
  }

  function handleRestart() {
    gen.reset();
    session.reset();
    showGenerationView = false;
  }
</script>

{#if isLoading}
  <LoadingScreen />
{:else if showGenerationView}
  <GenerationView
    {gen}
    {session}
    model={selectedModel}
    provider={selectedProvider}
    onSend={handleSend}
    onRetry={handleRetry}
    onStop={handleStop}
    onRestart={handleRestart}
    onSaveEdit={handleSaveEdit}
    onViewVersion={(n) => (session.viewing = n)}
  />
{:else}
  <WelcomeView
    bind:prompt
    bind:selectedModel
    bind:selectedProvider
    bind:selectedSystemPrompt
    bind:customSystemPrompt
    bind:maxTokens
    onGenerate={handleGenerate}
  />
{/if}
