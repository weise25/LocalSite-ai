<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ChevronDown, Copy, Download, ExternalLink, RotateCcw, Square } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import MoonLogo from '$lib/components/night/MoonLogo.svelte';
  import Popover from '$lib/components/ui/Popover.svelte';
  import Kbd from '$lib/components/ui/Kbd.svelte';
  import type { Version } from '$lib/state/session.svelte';

  interface Props {
    title: string;
    versions: Version[];
    /** Version currently on screen; null = latest / live */
    viewing: number | null;
    pendingN: number | null;
    generating: boolean;
    providerName: string;
    model: string;
    canExport: boolean;
    mod: string;
    status: Snippet;
    onView?: (n: number | null) => void;
    onStop: () => void;
    onRestart: () => void;
    onDownload: () => void;
    onCopy: () => void;
    onOpenTab: () => void;
  }

  let {
    title,
    versions,
    viewing,
    pendingN,
    generating,
    providerName,
    model,
    canExport,
    mod,
    status,
    onView,
    onStop,
    onRestart,
    onDownload,
    onCopy,
    onOpenTab
  }: Props = $props();

  let exportOpen = $state(false);
  const latestN = $derived(versions[versions.length - 1]?.n ?? null);
  // Only the most recent few pills fit; older versions live in the thread
  const pills = $derived(versions.slice(-4));
</script>

<header class="glass relative grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-2xl pl-3.5 pr-2.5">
  <div class="flex min-w-0 items-center gap-3.5">
    <button
      type="button"
      onclick={onRestart}
      disabled={generating}
      aria-label="Back to start"
      title="Back to start"
      class="shrink-0 rounded-full transition-opacity hover:opacity-80 disabled:opacity-60"
    >
      <MoonLogo />
    </button>
    <h1 class="truncate text-[14px] font-medium text-moon-bright" {title}>{title || 'Untitled'}</h1>
    <div class="hidden items-center gap-1 xl:flex" role="group" aria-label="Versions">
      {#each pills as v (v.n)}
        {@const active = viewing === v.n || (viewing === null && v.n === latestN && !pendingN)}
        <button
          type="button"
          onclick={() => onView?.(v.n === latestN ? null : v.n)}
          disabled={!onView || generating}
          aria-pressed={active}
          class={cn(
            'inline-flex h-[22px] items-center rounded-md border px-2 font-mono text-[11px] transition-colors',
            active ? 'border-moon/25 bg-moon/10 text-moon-bright' : 'border-moon/10 text-star-dim hover:text-star-2'
          )}
        >
          v{v.n}
        </button>
      {/each}
      {#if pendingN}
        <span class="inline-flex h-[22px] items-center gap-1.5 rounded-md border border-gold/25 bg-gold/[0.08] px-2 font-mono text-[11px] text-gold">
          v{pendingN}<span class="h-1.5 w-1.5 rounded-full bg-gold motion-safe:animate-pulse"></span>
        </span>
      {/if}
    </div>
  </div>

  {@render status()}

  <div class="flex items-center justify-end gap-2">
    <span class="mr-1.5 hidden min-w-0 items-center gap-2 truncate font-mono text-[11.5px] text-star-muted 2xl:flex" title={providerName}>
      <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-aurora shadow-[0_0_8px_#7DD3C0]"></span>
      <span class="truncate">{model}</span>
    </span>
    {#if generating}
      <button type="button" class="chip h-[34px] rounded-[9px]" onclick={onStop}>
        <Square class="h-3 w-3 fill-current" /> Stop <Kbd>esc</Kbd>
      </button>
    {:else}
      <button type="button" class="chip h-[34px] rounded-[9px]" onclick={onRestart}>
        <RotateCcw class="h-3.5 w-3.5" /> <span class="hidden lg:inline">New</span>
      </button>
    {/if}
    <Popover bind:open={exportOpen} align="end" label="Export" panelClass="w-[250px]">
      {#snippet trigger({ toggle, open, id })}
        <button
          type="button"
          onclick={toggle}
          disabled={!canExport}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={id}
          class="btn-moon flex h-[34px] items-center gap-2 rounded-[9px] px-3.5 text-[12.5px] font-semibold"
        >
          Export <ChevronDown class="h-3.5 w-3.5" />
        </button>
      {/snippet}
      {#snippet children({ close })}
        {@const items = [
          { label: 'Download index.html', icon: Download, k: `${mod}E`, run: onDownload },
          { label: 'Copy to clipboard', icon: Copy, k: '', run: onCopy },
          { label: 'Open in new tab', icon: ExternalLink, k: '', run: onOpenTab }
        ]}
        {#each items as item (item.label)}
          <button
            type="button"
            onclick={() => {
              item.run();
              close();
            }}
            class="flex h-10 w-full items-center gap-3 rounded-[9px] px-2.5 text-left text-[13px] text-star hover:bg-moon/[0.08]"
          >
            <item.icon class="h-4 w-4 text-star-muted" />
            <span class="flex-1">{item.label}</span>
            {#if item.k}<Kbd>{item.k}</Kbd>{/if}
          </button>
        {/each}
      {/snippet}
    </Popover>
  </div>
</header>
