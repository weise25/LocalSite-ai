<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    variant?: 'default' | 'outline' | 'secondary';
    class?: string;
    children?: Snippet;
  }

  let { variant = 'default', class: className = '', children }: Props = $props();

  const variants = {
    default: 'border-transparent bg-moon text-night-900',
    outline: 'border-moon/15 text-star-2',
    secondary: 'border-transparent bg-moon/10 text-star'
  };
</script>

<span
  class={cn(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors',
    variants[variant],
    className
  )}
>
  {@render children?.()}
</span>
