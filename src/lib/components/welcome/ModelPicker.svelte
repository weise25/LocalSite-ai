<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { RotateCw, Search } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import Kbd from '$lib/components/ui/Kbd.svelte';
  import MoonPhase from '$lib/components/night/MoonPhase.svelte';
  import { formatBytes, providerStore, type ProviderInfo } from '$lib/state/providers.svelte';

  interface Props {
    /** Text typed after "@" in the prompt; empty when opened from the chip */
    query?: string;
    /** Show an own search field (opened from the chip instead of via "@") */
    withSearch?: boolean;
    provider: string;
    model: string;
    onSelect: (provider: string, model: string) => void;
    onClose: () => void;
    class?: string;
  }

  let {
    query = '',
    withSearch = false,
    provider,
    model,
    onSelect,
    onClose,
    class: className = ''
  }: Props = $props();

  const MAX_ROWS = 150;
  const uid = $props.id();

  let search = $state('');
  // svelte-ignore state_referenced_locally
  let focused = $state(provider);
  let activeIndex = $state(0);
  let listEl = $state<HTMLDivElement>();
  let searchEl = $state<HTMLInputElement>();

  const providers = $derived(providerStore.providers);
  const local = $derived(providers.filter((p) => p.isLocal));
  const cloud = $derived(providers.filter((p) => !p.isLocal));
  const ordered = $derived([...local, ...cloud]);
  const focusedInfo = $derived(providerStore.byId(focused));

  const q = $derived((withSearch ? search : query).trim().toLowerCase());

  const parsed = $derived.by(() => {
    if (q.includes('/')) {
      const [pq, ...rest] = q.split('/');
      return { providerHint: matchProvider(pq), modelQuery: rest.join('/') };
    }
    return { providerHint: matchProvider(q), modelQuery: q };
  });

  function matchProvider(text: string): ProviderInfo | undefined {
    if (!text) return undefined;
    return providers.find(
      (p) => p.id.startsWith(text) || p.name.toLowerCase().replace(/\s+/g, '').startsWith(text)
    );
  }

  const allModels = $derived(providerStore.models[focused] ?? []);
  const status = $derived(providerStore.status[focused] ?? 'idle');

  function filterModels(list: typeof allModels, text: string) {
    if (!text) return list;
    const parts = text.split(/\s+/).filter(Boolean);
    return list.filter((m) => {
      const hay = `${m.id} ${m.name}`.toLowerCase();
      return parts.every((part) => hay.includes(part));
    });
  }

  // "@anth" should jump to Anthropic, "@qw" should filter the current provider
  const modelQuery = $derived(
    parsed.providerHint && parsed.providerHint.id === focused && !q.includes('/') &&
      filterModels(allModels, parsed.modelQuery).length === 0
      ? ''
      : parsed.modelQuery
  );

  const filtered = $derived(filterModels(allModels, modelQuery));
  const visible = $derived(filtered.slice(0, MAX_ROWS));
  const activeModel = $derived(visible[activeIndex]);

  // Switch provider when the query names one
  $effect(() => {
    const hint = parsed.providerHint;
    if (!hint || hint.id === focused) return;
    const ownMatches = filterModels(providerStore.models[focused] ?? [], parsed.modelQuery);
    if (q.includes('/') || ownMatches.length === 0) focused = hint.id;
  });

  // Fetch models for whichever provider has focus
  $effect(() => {
    if (focused) void providerStore.loadModels(focused);
  });

  // Keep the active row on the current model when the list changes
  $effect(() => {
    const list = visible;
    const current = list.findIndex((m) => m.id === model && focused === provider);
    activeIndex = current >= 0 && !modelQuery ? current : 0;
  });

  onMount(() => {
    void providerStore.loadProviders().then(() => {
      if (!providerStore.byId(focused)) {
        focused = providerStore.providers.find((p) => p.configured)?.id ?? '';
      }
    });
    if (withSearch) void tick().then(() => searchEl?.focus());
  });

  function scrollActiveIntoView() {
    void tick().then(() => {
      listEl?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({
        block: 'nearest'
      });
    });
  }

  function moveProvider(delta: number) {
    const list = ordered;
    if (!list.length) return;
    const idx = list.findIndex((p) => p.id === focused);
    focused = list[(idx + delta + list.length) % list.length].id;
  }

  function choose(modelId: string) {
    if (!focusedInfo?.configured) return;
    onSelect(focused, modelId);
  }

  /** Keyboard handling, also called by the prompt textarea while typing "@…" */
  export function handleKey(event: KeyboardEvent): boolean {
    switch (event.key) {
      case 'ArrowDown':
        if (visible.length) activeIndex = (activeIndex + 1) % visible.length;
        scrollActiveIntoView();
        break;
      case 'ArrowUp':
        if (visible.length) activeIndex = (activeIndex - 1 + visible.length) % visible.length;
        scrollActiveIntoView();
        break;
      case 'ArrowRight':
        if (!withSearch && !event.shiftKey) return false;
        moveProvider(1);
        break;
      case 'ArrowLeft':
        if (!withSearch && !event.shiftKey) return false;
        moveProvider(-1);
        break;
      case 'Tab':
        moveProvider(event.shiftKey ? -1 : 1);
        break;
      case 'Enter':
        if (activeModel) choose(activeModel.id);
        break;
      case 'Escape':
        onClose();
        break;
      default:
        return false;
    }
    event.preventDefault();
    return true;
  }

  function providerMeta(p: ProviderInfo): string {
    const s = providerStore.status[p.id];
    if (!p.configured) return p.id === 'openai_compatible' ? 'set base URL' : 'add key';
    if (s === 'loading') return 'checking…';
    if (s === 'error') return p.isLocal ? 'offline' : 'error';
    if (s === 'ready') {
      const n = providerStore.models[p.id]?.length ?? 0;
      return `${n} model${n === 1 ? '' : 's'}`;
    }
    return p.isLocal ? '' : 'key set';
  }

  function dotClass(p: ProviderInfo): string {
    const s = providerStore.status[p.id];
    if (!p.configured || s === 'error') return 'border border-star-faint';
    if (p.isLocal && s === 'ready') return 'bg-aurora shadow-[0_0_10px_#7DD3C0]';
    return 'bg-star-muted';
  }

  function modelDetails(m: (typeof allModels)[number]): string {
    return [m.family, m.parameterSize, m.quantization, formatBytes(m.size)]
      .filter(Boolean)
      .join(' · ');
  }
</script>

{#snippet providerRow(p: ProviderInfo)}
  <button
    type="button"
    onclick={() => (focused = p.id)}
    aria-pressed={focused === p.id}
    class={cn(
      'flex h-10 shrink-0 items-center justify-between gap-3 rounded-[10px] border px-2.5 text-left text-[13.5px] transition-colors md:w-full',
      focused === p.id
        ? 'border-moon/[0.16] bg-moon/[0.08] text-moon-bright'
        : 'border-transparent hover:bg-moon/[0.04]',
      p.configured ? 'text-star-2' : 'text-star-dim'
    )}
  >
    <span class="flex items-center gap-2.5 whitespace-nowrap">
      <span class={cn('h-2 w-2 shrink-0 rounded-full', dotClass(p))}></span>
      {p.name}
    </span>
    <span class="hidden font-mono text-[11px] text-star-dim md:inline">{providerMeta(p)}</span>
  </button>
{/snippet}

<div class={cn('flex min-h-0 flex-col', className)}>
  {#if withSearch}
    <div class="flex items-center gap-2.5 border-b border-moon/[0.08] px-4">
      <Search class="h-4 w-4 text-star-dim" />
      <label for="{uid}-search" class="sr-only">Search models</label>
      <input
        id="{uid}-search"
        bind:this={searchEl}
        bind:value={search}
        onkeydown={(e) => handleKey(e)}
        placeholder="Search models — or type provider/model"
        autocomplete="off"
        class="h-12 w-full bg-transparent text-[15px] text-star placeholder:text-star-dim focus:outline-none"
      />
    </div>
  {/if}

  <div class="grid min-h-0 flex-1 md:grid-cols-[250px_minmax(0,1fr)]">
    <div
      class="flex gap-1 overflow-x-auto border-b border-moon/[0.08] p-2 md:max-h-[min(52vh,400px)] md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:p-2.5"
    >
      {#if !providerStore.providersLoaded}
        <div class="p-3 text-[13px] text-star-dim">Looking for providers…</div>
      {:else if providerStore.providersError}
        <div class="p-3 text-[13px] text-ember">Providers could not be loaded.</div>
      {:else}
        {#if local.length}
          <span class="label-mono hidden px-2.5 pb-1.5 pt-1 md:block">On this machine</span>
          {#each local as p (p.id)}{@render providerRow(p)}{/each}
        {/if}
        {#if cloud.length}
          <span class="label-mono hidden px-2.5 pb-1.5 pt-4 md:block">Cloud</span>
          {#each cloud as p (p.id)}{@render providerRow(p)}{/each}
        {/if}
      {/if}
    </div>

    <div class="flex min-h-0 flex-col p-2.5">
      {#if focusedInfo}
        <div class="flex items-center justify-between px-2.5 pb-2 pt-1">
          <span class="label-mono">
            {focusedInfo.name}
            {#if status === 'ready'}
              · {modelQuery ? `${filtered.length} of ${allModels.length} match “${modelQuery}”` : `${allModels.length} models`}
            {/if}
          </span>
          {#if status === 'ready' && allModels.some((m) => m.size)}
            <span class="label-mono">Size</span>
          {/if}
        </div>

        {#if !focusedInfo.configured}
          <div class="m-1 rounded-[14px] border border-moon/[0.08] bg-night-950/50 p-4 text-[13px] leading-relaxed text-star-2">
            <p class="font-medium text-star">{focusedInfo.name} is not set up yet.</p>
            <p class="mt-1.5">
              {#if focusedInfo.id === 'openai_compatible'}
                Add <code class="font-mono text-moon">{focusedInfo.baseUrlEnvVar}</code> and
                <code class="font-mono text-moon">{focusedInfo.apiKeyEnvVar}</code>
              {:else}
                Add <code class="font-mono text-moon">{focusedInfo.apiKeyEnvVar}</code>
              {/if}
              to <code class="font-mono">.env.local</code> and restart LocalSite.
            </p>
          </div>
        {:else if status === 'loading' || status === 'idle'}
          <div class="flex flex-col gap-1.5 p-1" aria-busy="true">
            {#each [0, 1, 2] as i (i)}
              <div class="h-11 animate-pulse rounded-[10px] bg-moon/[0.04]" style="animation-delay: {i * 120}ms"></div>
            {/each}
          </div>
        {:else if status === 'error'}
          <div class="m-1 rounded-[14px] border border-moon/[0.08] bg-night-950/50 p-4 text-[13px] leading-relaxed text-star-2">
            <p class="font-medium text-star">
              {focusedInfo.isLocal ? `${focusedInfo.name} is asleep.` : `${focusedInfo.name} did not answer.`}
            </p>
            <p class="mt-1.5">{providerStore.errors[focused]}</p>
            <button
              type="button"
              class="chip mt-3"
              onclick={() => providerStore.loadModels(focused, { force: true })}
            >
              <RotateCw class="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        {:else if visible.length === 0}
          <div class="p-4 text-[13px] text-star-muted">
            {#if allModels.length === 0}
              No models found.
              {#if focusedInfo.id === 'ollama'}
                Pull one with <code class="font-mono text-moon">ollama pull qwen2.5-coder</code>.
              {/if}
            {:else}
              Nothing matches “{modelQuery}”.
            {/if}
          </div>
        {:else}
          <div
            bind:this={listEl}
            role="listbox"
            aria-label="{focusedInfo.name} models"
            class="flex max-h-[min(46vh,340px)] flex-col gap-0.5 overflow-y-auto"
          >
            {#each visible as m, i (m.id)}
              {@const isActive = i === activeIndex}
              {@const isCurrent = m.id === model && focused === provider}
              <button
                type="button"
                role="option"
                aria-selected={isCurrent}
                data-index={i}
                onclick={() => choose(m.id)}
                onmousemove={() => (activeIndex = i)}
                class={cn(
                  'flex min-h-11 w-full shrink-0 items-center justify-between gap-3 rounded-[10px] border px-3 text-left transition-colors',
                  isActive ? 'border-moon/20 bg-moon/[0.09] text-moon-bright' : 'border-transparent text-star-2'
                )}
              >
                <span class="flex min-w-0 items-center gap-2.5">
                  <span class="truncate font-mono text-[13px]">{m.name}</span>
                  {#if m.parameterSize}
                    <span class="hidden shrink-0 rounded-[5px] bg-moon/[0.07] px-1.5 py-0.5 font-mono text-[10.5px] text-star-muted sm:inline">{m.parameterSize}</span>
                  {/if}
                  {#if m.quantization}
                    <span class="hidden shrink-0 rounded-[5px] bg-moon/[0.07] px-1.5 py-0.5 font-mono text-[10.5px] text-star-muted sm:inline">{m.quantization}</span>
                  {/if}
                  {#if isCurrent}
                    <span class="shrink-0 font-mono text-[10.5px] text-aurora">current</span>
                  {/if}
                </span>
                <span class="shrink-0 font-mono text-[11.5px] text-star-muted">{formatBytes(m.size)}</span>
              </button>
            {/each}
            {#if filtered.length > visible.length}
              <p class="px-3 py-2 text-[12px] text-star-dim">
                {filtered.length - visible.length} more — keep typing to narrow it down.
              </p>
            {/if}
          </div>

          {#if activeModel}
            <div class="mt-2 hidden items-center gap-3.5 rounded-[14px] border border-moon/[0.08] bg-night-950/50 p-3 sm:flex">
              <MoonPhase phase="full" size={28} />
              <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                <span class="truncate text-[13.5px] text-moon-bright">{activeModel.name}</span>
                <span class="truncate text-[12px] text-star-muted">
                  {modelDetails(activeModel) || focusedInfo.description}
                </span>
              </div>
              <Kbd class="h-6 px-2">↵ select</Kbd>
            </div>
          {/if}
        {/if}
      {/if}
    </div>
  </div>

  <div class="hidden items-center gap-4 border-t border-moon/[0.08] bg-night-950/40 px-4 py-2.5 text-[12px] text-star-dim sm:flex">
    <span class="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> model</span>
    <span class="flex items-center gap-1.5"><Kbd>⇥</Kbd> provider</span>
    <span class="flex items-center gap-1.5"><Kbd>↵</Kbd> select</span>
    <span class="ml-auto flex items-center gap-1.5"><Kbd>esc</Kbd> back to prompt</span>
  </div>
</div>
