<script lang="ts">
  import { onMount } from 'svelte';
  import { X } from '@lucide/svelte';
  import { historyStore, thumbnailColors } from '$lib/state/history.svelte';
  import { themeStore } from '$lib/state/theme.svelte';
  import type { SessionSnapshot } from '$lib/state/session.svelte';

  interface Props {
    onOpen: (id: string) => void;
  }

  let { onOpen }: Props = $props();

  onMount(() => historyStore.load());

  const DAY = 24 * 60 * 60 * 1000;
  const recentLabel = $derived(themeStore.theme === 'day' ? 'Today' : 'Tonight');

  const groups = $derived.by(() => {
    const now = Date.now();
    const recent: SessionSnapshot[] = [];
    const earlier: SessionSnapshot[] = [];
    for (const s of historyStore.sessions) (now - s.updatedAt < DAY ? recent : earlier).push(s);
    return [
      { label: recentLabel, items: recent },
      { label: 'Earlier', items: earlier }
    ].filter((g) => g.items.length);
  });

  function when(ts: number) {
    const d = new Date(ts);
    if (Date.now() - ts < DAY) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (Date.now() - ts < 6 * DAY) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
</script>

{#if !groups.length}
  <p class="px-2.5 py-2 text-[12.5px] leading-relaxed text-star-dim">
    Your generations will gather here, {themeStore.theme === 'day' ? 'day after day' : 'night after night'}.
  </p>
{:else}
  {#each groups as group, gi (group.label)}
    <h2 class="label-mono px-2.5 pb-1.5 {gi ? 'pt-4' : 'pt-1.5'}">{group.label}</h2>
    <ul class="flex flex-col gap-0.5">
      {#each group.items as item (item.id)}
        {@const latest = item.versions[item.versions.length - 1]}
        {@const [c1, c2] = thumbnailColors(latest)}
        <li class="group relative">
          <button
            type="button"
            onclick={() => onOpen(item.id)}
            class="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 pr-9 text-left transition-colors hover:bg-moon/[0.06]"
          >
            <span
              class="h-6 w-[34px] shrink-0 rounded-[5px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]"
              style="background: linear-gradient(180deg, {c1} 58%, {c2} 58%)"
            ></span>
            <span class="flex min-w-0 flex-col gap-0.5">
              <span class="truncate text-[13px] text-star">{item.title || 'Untitled'}</span>
              <span class="font-mono text-[10.5px] text-star-dim">v{latest?.n ?? 1} · {when(item.updatedAt)}</span>
            </span>
          </button>
          <button
            type="button"
            aria-label="Delete “{item.title}”"
            onclick={() => historyStore.remove(item.id)}
            class="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-star-dim opacity-0 transition-opacity hover:bg-moon/[0.08] hover:text-star focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </li>
      {/each}
    </ul>
  {/each}
{/if}
