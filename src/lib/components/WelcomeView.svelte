<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { Menu } from '@lucide/svelte';
  import NightSky from '$lib/components/night/NightSky.svelte';
  import MoonPhase from '$lib/components/night/MoonPhase.svelte';
  import Kbd from '$lib/components/ui/Kbd.svelte';
  import Sidebar from '$lib/components/welcome/Sidebar.svelte';
  import PromptPalette from '$lib/components/welcome/PromptPalette.svelte';
  import { providerStore } from '$lib/state/providers.svelte';
  import { modKey } from '$lib/client/platform';

  interface Props {
    prompt: string;
    selectedModel: string;
    selectedProvider: string;
    selectedSystemPrompt: string;
    customSystemPrompt: string;
    maxTokens: number | undefined;
    onGenerate: () => void;
    /** Optional history list rendered inside the sidebar */
    history?: Snippet;
  }

  let {
    prompt = $bindable(''),
    selectedModel = $bindable(''),
    selectedProvider = $bindable(''),
    selectedSystemPrompt = $bindable('default'),
    customSystemPrompt = $bindable(''),
    maxTokens = $bindable<number | undefined>(undefined),
    onGenerate,
    history
  }: Props = $props();

  const REPO_URL = 'https://github.com/weise25/LocalSite-ai';

  let palette = $state<ReturnType<typeof PromptPalette>>();
  let sidebarOpen = $state(false);
  let now = $state(new Date());
  let mod = $state('⌘');

  const hour = $derived(now.getHours());
  const timeOfDay = $derived(hour >= 18 || hour < 5 ? 'tonight' : 'today');
  const clock = $derived(
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  const providerInfo = $derived(providerStore.byId(selectedProvider));
  const modelCount = $derived(providerStore.models[selectedProvider]?.length ?? 0);
  const providerStatus = $derived(providerStore.status[selectedProvider]);

  const starters = [
    {
      name: 'Product launch',
      hint: 'Hero, features, waitlist',
      thumb: 'linear-gradient(180deg,#E9E2D6 62%,#1A1714 62%)',
      prompt:
        'A launch page for a minimalist e-ink note-taking tablet. Calm, paper-like palette, big product hero, three feature rows with illustrations, a waitlist form and an FAQ.'
    },
    {
      name: 'Portfolio',
      hint: 'Case studies, about',
      thumb: 'linear-gradient(180deg,#1D2420 58%,#D7E3D2 58%)',
      prompt:
        'A portfolio for an independent architect. Editorial serif typography, a full-width project grid with hover captions, an about section with a portrait placeholder and a contact footer.'
    },
    {
      name: 'Event night',
      hint: 'Lineup, tickets, map',
      thumb: 'linear-gradient(180deg,#16193A 55%,#C9D3FF 55%)',
      prompt:
        'A page for an open-air night concert by the river. Dark, starry atmosphere, a countdown, the lineup with set times, ticket tiers and a simple map of the venue.'
    }
  ];

  onMount(() => {
    mod = modKey();
    const timer = setInterval(() => (now = new Date()), 30_000);

    void (async () => {
      await providerStore.loadProviders();
      if (providerStore.providersError) {
        toast.error('Providers could not be loaded.');
        return;
      }
      const configured = providerStore.providers.filter((p) => p.configured);
      if (!providerStore.byId(selectedProvider)?.configured) {
        const fallback = providerStore.byId(providerStore.defaultProvider);
        selectedProvider = fallback?.configured ? fallback.id : (configured[0]?.id ?? '');
      }
      // Wake-check local servers so the sidebar can show their state
      for (const p of providerStore.providers) {
        if (p.isLocal && p.configured && p.id !== selectedProvider) void providerStore.loadModels(p.id);
      }
    })();

    return () => clearInterval(timer);
  });

  // Load models for the selected provider and keep the model valid
  $effect(() => {
    const provider = selectedProvider;
    if (!provider || !providerStore.providersLoaded) return;
    void providerStore.loadModels(provider).then((models) => {
      if (provider !== selectedProvider) return;
      if (providerStore.status[provider] === 'error') {
        toast.error(providerStore.errors[provider] || 'Models could not be loaded.');
        return;
      }
      if (models.length && !models.some((m) => m.id === selectedModel)) {
        selectedModel = models[0].id;
      }
    });
  });

  function useStarter(text: string) {
    prompt = text;
    palette?.focus();
  }

  function newGeneration() {
    prompt = '';
    sidebarOpen = false;
    palette?.focus();
  }
</script>

<div class="relative min-h-dvh overflow-hidden bg-night-950 text-star">
  <NightSky variant="full" moon horizon class="fixed" />

  <Sidebar open={sidebarOpen} onClose={() => (sidebarOpen = false)} onNew={newGeneration}>
    {#if history}{@render history()}{/if}
  </Sidebar>

  <div class="relative flex min-h-dvh flex-col lg:pl-[282px]">
    <header class="flex items-center justify-between gap-4 px-4 py-4 sm:px-9 sm:py-6">
      <button
        type="button"
        aria-label="Open sidebar"
        onclick={() => (sidebarOpen = true)}
        class="flex h-11 w-11 items-center justify-center rounded-xl text-star-2 hover:bg-moon/[0.07] lg:invisible"
      >
        <Menu class="h-5 w-5" />
      </button>
      <nav class="flex items-center gap-5 text-[13px] text-star-muted sm:gap-6">
        <time class="font-mono text-[12px] text-star-2" datetime={now.toISOString()}>{clock}</time>
        <a href="{REPO_URL}#readme" target="_blank" rel="noreferrer" class="transition-colors hover:text-star">Docs</a>
        <a href={REPO_URL} target="_blank" rel="noreferrer" class="transition-colors hover:text-star">GitHub</a>
      </nav>
    </header>

    <main class="flex flex-1 flex-col items-center px-4 pb-28 pt-16 sm:px-12 sm:pt-[4vh]">
      <div class="flex flex-col items-center gap-[18px] text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-700">
        <span
          class="inline-flex h-[30px] items-center gap-2.5 rounded-full border border-moon/[0.12] bg-moon/[0.04] pl-2.5 pr-3.5 text-[12.5px] text-star-2 backdrop-blur"
        >
          <MoonPhase phase={providerStatus === 'loading' ? 'waxing' : providerStatus === 'error' ? 'new' : 'half'} size={14} />
          {#if !providerInfo}
            Looking for providers…
          {:else if providerStatus === 'error'}
            {providerInfo.name} is asleep — pick another provider with @
          {:else if providerInfo.isLocal}
            {modelCount ? `${modelCount} models on this machine` : `Waking ${providerInfo.name}…`} · nothing leaves it
          {:else}
            Generating with {providerInfo.name} · cloud
          {/if}
        </span>
        <h1 class="text-[40px] font-light leading-[1.04] tracking-[-0.035em] sm:text-[64px]">
          What are we<br />
          <span class="text-moonlit font-serif text-[52px] font-normal italic tracking-[-0.01em] sm:text-[84px]">
            building {timeOfDay}?
          </span>
        </h1>
      </div>

      <div class="mt-9 w-full max-w-[800px] animate-in fade-in-0 slide-in-from-bottom-3 duration-700">
        <PromptPalette
          bind:this={palette}
          bind:prompt
          bind:provider={selectedProvider}
          bind:model={selectedModel}
          bind:systemPrompt={selectedSystemPrompt}
          bind:customSystemPrompt
          bind:maxTokens
          {onGenerate}
        />
      </div>

      <div class="mt-4 grid w-full max-w-[800px] gap-3 sm:grid-cols-3">
        {#each starters as s (s.name)}
          <button
            type="button"
            onclick={() => useStarter(s.prompt)}
            class="flex items-center gap-3 rounded-[14px] border border-moon/[0.08] bg-night-800/60 p-2.5 text-left backdrop-blur transition-colors hover:border-moon/[0.16] hover:bg-night-700/70"
          >
            <span class="h-10 w-14 shrink-0 rounded-[7px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]" style="background: {s.thumb}"></span>
            <span class="flex flex-col gap-0.5">
              <span class="text-[13px] text-star">{s.name}</span>
              <span class="text-[11.5px] text-star-dim">{s.hint}</span>
            </span>
          </button>
        {/each}
      </div>
    </main>

    <footer class="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center gap-5 text-[12px] text-star-dim sm:flex lg:pl-[282px]">
      <span class="flex items-center gap-1.5"><Kbd>@</Kbd> provider &amp; model</span>
      <span class="flex items-center gap-1.5"><Kbd>{mod}↵</Kbd> generate</span>
      <span class="flex items-center gap-1.5"><Kbd>esc</Kbd> close menus</span>
    </footer>
  </div>
</div>
