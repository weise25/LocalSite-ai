<script lang="ts">
  import { Moon, Sun, SunMoon } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import { themeStore } from '$lib/state/theme.svelte';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  const label = $derived(
    themeStore.mode === 'auto'
      ? `Theme: automatic (${themeStore.theme === 'day' ? 'Daylight' : 'Nocturne'} right now)`
      : themeStore.mode === 'day'
        ? 'Theme: always Daylight'
        : 'Theme: always Nocturne'
  );
</script>

<button
  type="button"
  onclick={() => themeStore.cycle()}
  aria-label={label}
  title={label}
  class={cn(
    'flex h-9 w-9 items-center justify-center rounded-[9px] border border-moon/10 bg-moon/[0.03] text-star-2 transition-colors hover:bg-moon/[0.08] hover:text-star',
    className
  )}
>
  {#if themeStore.mode === 'auto'}
    <SunMoon class="h-4 w-4" />
  {:else if themeStore.mode === 'day'}
    <Sun class="h-4 w-4" />
  {:else}
    <Moon class="h-4 w-4" />
  {/if}
</button>
