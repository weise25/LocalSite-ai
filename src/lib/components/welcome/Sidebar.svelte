<script lang="ts">
  import type { Snippet } from 'svelte';
  import { PanelLeftClose, Plus } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import MoonLogo from '$lib/components/night/MoonLogo.svelte';
  import { providerStore } from '$lib/state/providers.svelte';

  interface Props {
    /** Drawer state on small screens; always visible from lg up */
    open?: boolean;
    onClose?: () => void;
    onNew: () => void;
    children?: Snippet;
  }

  let { open = false, onClose, onNew, children }: Props = $props();

  const localProviders = $derived(providerStore.providers.filter((p) => p.isLocal));

  function statusLabel(id: string) {
    const s = providerStore.status[id];
    if (s === 'ready') return 'awake';
    if (s === 'error') return 'asleep';
    return 'checking…';
  }

  function onKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') onClose?.();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-40 bg-night-950/60 backdrop-blur-[2px] animate-in fade-in-0 lg:hidden"
    role="presentation"
    onclick={onClose}
  ></div>
{/if}

<aside
  aria-label="Sidebar"
  class={cn(
    'glass fixed bottom-3.5 left-3.5 top-3.5 z-50 flex w-[264px] flex-col gap-[18px] rounded-[18px] px-2.5 py-4 transition-transform duration-300 lg:z-10 lg:translate-x-0',
    open ? 'translate-x-0' : '-translate-x-[calc(100%+24px)] max-lg:invisible'
  )}
>
  <div class="flex items-center justify-between px-2">
    <a href="/" class="flex items-center gap-2.5 rounded-md">
      <MoonLogo />
      <span class="text-[15px] font-semibold tracking-tight">LocalSite</span>
    </a>
    <button
      type="button"
      aria-label="Close sidebar"
      onclick={onClose}
      class="flex h-9 w-9 items-center justify-center rounded-lg text-star-dim hover:bg-moon/[0.07] hover:text-star lg:hidden"
    >
      <PanelLeftClose class="h-4 w-4" />
    </button>
  </div>

  <button
    type="button"
    onclick={onNew}
    class="flex h-10 items-center gap-2 rounded-[10px] border border-moon/[0.14] bg-moon/[0.06] px-3 text-[13px] text-moon-bright transition-colors hover:bg-moon/10"
  >
    <Plus class="h-3.5 w-3.5" />
    New generation
  </button>

  <div class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
    {#if children}
      {@render children()}
    {:else}
      <p class="px-2.5 py-2 text-[12.5px] leading-relaxed text-star-dim">
        Your generations will gather here, night after night.
      </p>
    {/if}
  </div>

  {#if localProviders.length}
    <div class="flex flex-col gap-2 rounded-xl border border-moon/[0.07] bg-night-950/50 p-3">
      {#each localProviders as p (p.id)}
        {@const s = providerStore.status[p.id]}
        <div class="flex items-center justify-between text-[12px]">
          <span class={cn('flex items-center gap-2', s === 'ready' ? 'text-star' : 'text-star-muted')}>
            <span
              class={cn(
                'h-[7px] w-[7px] rounded-full',
                s === 'ready' ? 'bg-aurora shadow-[0_0_10px_#7DD3C0]' : 'border border-star-faint'
              )}
            ></span>
            {p.name} {statusLabel(p.id)}
          </span>
          {#if s === 'ready'}
            <span class="font-mono text-[10.5px] text-star-dim">
              {providerStore.models[p.id]?.length ?? 0} models
            </span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</aside>
