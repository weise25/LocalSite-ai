<script lang="ts">
  import StarrySky from './StarrySky.svelte';
  import DaySky from './DaySky.svelte';
  import { themeStore } from '$lib/state/theme.svelte';

  interface Props {
    variant?: 'full' | 'quiet';
    /** Moon at night, sun by day */
    moon?: boolean;
    horizon?: boolean;
    seed?: number;
    class?: string;
  }

  let { variant = 'full', moon = false, horizon = false, seed, class: className = '' }: Props = $props();
</script>

{#if themeStore.theme === 'day'}
  <DaySky {variant} sun={moon} {horizon} class={className} />
{:else}
  <StarrySky {variant} {moon} {horizon} {seed} class={className} />
{/if}
