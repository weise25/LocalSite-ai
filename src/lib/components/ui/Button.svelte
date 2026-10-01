<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  type Variant = 'default' | 'outline' | 'ghost' | 'secondary';
  type Size = 'default' | 'sm' | 'icon';

  interface Props extends HTMLButtonAttributes {
    variant?: Variant;
    size?: Size;
    class?: string;
    children?: Snippet;
  }

  let {
    variant = 'default',
    size = 'default',
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const variants: Record<Variant, string> = {
    default: 'btn-moon font-semibold',
    outline:
      'border border-moon/[0.12] bg-moon/[0.04] text-star-2 hover:border-moon/20 hover:bg-moon/[0.08] hover:text-star',
    ghost: 'text-star-muted hover:bg-moon/[0.07] hover:text-star',
    secondary: 'bg-moon/10 text-star hover:bg-moon/[0.14]'
  };

  const sizes: Record<Size, string> = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 rounded-[9px] px-3 text-[12.5px]',
    icon: 'h-10 w-10'
  };
</script>

<button
  class={cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className
  )}
  {...rest}
>
  {@render children?.()}
</button>
