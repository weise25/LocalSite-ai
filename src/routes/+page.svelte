<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import WelcomeView from '$lib/components/WelcomeView.svelte';
  import GenerationView from '$lib/components/GenerationView.svelte';
  import { CodeGeneration } from '$lib/state/code-generation.svelte';
  import { readJSON, writeJSON } from '$lib/client/storage';

  let isLoading = $state(true);
  let showGenerationView = $state(false);

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

  let prompt = $state('');
  let selectedProvider = $state(prefs.provider ?? '');
  let selectedModel = $state(prefs.model ?? '');
  let selectedSystemPrompt = $state(prefs.systemPrompt ?? 'default');
  let customSystemPrompt = $state(prefs.customSystemPrompt ?? '');
  let maxTokens = $state<number | undefined>(prefs.maxTokens);

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

  const gen = new CodeGeneration();

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

  async function handleGenerate() {
    if (!validateGenerationInput()) return;

    showGenerationView = true;
    await gen.generateCode({
      prompt,
      model: selectedModel,
      provider: selectedProvider,
      maxTokens,
      systemPromptType: selectedSystemPrompt,
      customSystemPrompt
    });
  }

  async function handleRegenerateWithNewPrompt(newPrompt: string) {
    prompt = newPrompt;
    await gen.generateCode({
      prompt: newPrompt,
      model: selectedModel,
      provider: selectedProvider,
      maxTokens,
      systemPromptType: selectedSystemPrompt,
      customSystemPrompt
    });
  }

  function handleRestart() {
    gen.reset();
    showGenerationView = false;
  }
</script>

{#if isLoading}
  <LoadingScreen />
{:else if showGenerationView}
  <GenerationView
    {prompt}
    model={selectedModel}
    provider={selectedProvider}
    generatedCode={gen.generatedCode}
    isGenerating={gen.isGenerating}
    generationComplete={gen.generationComplete}
    thinkingOutput={gen.thinkingOutput}
    isThinking={gen.isThinking}
    onRegenerateWithNewPrompt={handleRegenerateWithNewPrompt}
    onRestart={handleRestart}
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
