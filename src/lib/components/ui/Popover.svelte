<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface TriggerProps {
    open: boolean;
    toggle: () => void;
    id: string;
  }

  interface Props {
    open?: boolean;
    align?: 'start' | 'end';
    side?: 'top' | 'bottom';
    class?: string;
    panelClass?: string;
    label?: string;
    trigger: Snippet<[TriggerProps]>;
    children: Snippet<[{ close: () => void }]>;
  }

  let {
    open = $bindable(false),
    align = 'start',
    side = 'bottom',
    class: className = '',
    panelClass = '',
    label,
    trigger,
    children
  }: Props = $props();

  const id = $props.id();
  let root = $state<HTMLDivElement>();

  function toggle() {
    open = !open;
  }

  function close() {
    open = false;
    root?.querySelector<HTMLElement>(`[aria-controls="${id}"]`)?.focus();
  }

  function onPointerDown(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) open = false;
  }

  function onKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  }
</script>

<svelte:window onpointerdown={onPointerDown} onkeydown={onKeydown} />

<div bind:this={root} class={cn('relative', className)}>
  {@render trigger({ open, toggle, id })}
  {#if open}
    <div
      {id}
      role="dialog"
      aria-label={label}
      class={cn(
        'glass-solid absolute z-50 min-w-[220px] rounded-[14px] p-1.5 animate-in fade-in-0 zoom-in-95',
        side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
        align === 'start' ? 'left-0' : 'right-0',
        panelClass
      )}
    >
      {@render children({ close })}
    </div>
  {/if}
</div>
