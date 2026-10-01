<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  interface Props extends HTMLInputAttributes {
    value?: string | number;
    class?: string;
  }

  let { value = $bindable(''), class: className = '', ...rest }: Props = $props();
</script>

<input
  bind:value
  class={cn(
    'flex h-10 w-full rounded-[10px] border border-moon/[0.12] bg-night-950/50 px-3 py-2 text-sm text-star placeholder:text-star-dim transition-colors focus-visible:border-moon/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moon/15 disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {...rest}
/>
