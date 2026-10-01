<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tick } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    open?: boolean;
    class?: string;
    labelledby?: string;
    /** Allow closing via Escape / backdrop click */
    dismissible?: boolean;
    children?: Snippet;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    open = $bindable(false),
    class: className = '',
    labelledby,
    dismissible = true,
    children,
    onOpenChange
  }: Props = $props();

  let panel = $state<HTMLDivElement>();
  let returnFocus: HTMLElement | null = null;

  function close() {
    if (!dismissible) return;
    open = false;
    onOpenChange?.(false);
  }

  $effect(() => {
    if (!open) return;
    returnFocus = document.activeElement as HTMLElement | null;
    void tick().then(() => {
      const target = panel?.querySelector<HTMLElement>(
        'textarea, input, button, [href], select, [tabindex]:not([tabindex="-1"])'
      );
      (target ?? panel)?.focus();
    });
    return () => returnFocus?.focus?.();
  });

  function onKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      class="absolute inset-0 bg-night-950/70 backdrop-blur-sm animate-in fade-in-0"
      role="presentation"
      onclick={close}
    ></div>
    <div
      bind:this={panel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledby}
      tabindex="-1"
      class={cn(
        'glass-solid glass-edge relative z-10 w-full max-w-lg rounded-2xl p-6 text-star animate-in fade-in-0 zoom-in-95',
        className
      )}
    >
      {@render children?.()}
    </div>
  </div>
{/if}
