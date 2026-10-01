<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import { ArrowUp, Square } from '@lucide/svelte';
  import { cn } from '$lib/utils';

  interface Props {
    value: string;
    generating: boolean;
    placeholder?: string;
    /** Allow sending while a generation runs (the message gets queued) */
    canQueue?: boolean;
    hint?: string;
    tools?: Snippet;
    above?: Snippet;
    onSend: (text: string) => void;
    onStop: () => void;
    class?: string;
  }

  let {
    value = $bindable(''),
    generating,
    placeholder = 'Describe a change…',
    canQueue = false,
    hint = '',
    tools,
    above,
    onSend,
    onStop,
    class: className = ''
  }: Props = $props();

  let textarea = $state<HTMLTextAreaElement>();
  const uid = $props.id();
  const canSend = $derived(!!value.trim() && (!generating || canQueue));

  function resize() {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 168)}px`;
  }

  $effect(() => {
    void value;
    void tick().then(resize);
  });

  function send() {
    if (!canSend) return;
    onSend(value.trim());
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      send();
    }
  }

  export function focus() {
    textarea?.focus();
  }
</script>

<div
  class={cn(
    'flex flex-col gap-2.5 rounded-[14px] border border-moon/10 bg-night-950/55 py-3 pl-3.5 pr-2.5 transition-colors focus-within:border-moon/25',
    className
  )}
>
  {#if above}{@render above()}{/if}
  <label for="{uid}-input" class="sr-only">Describe the next change</label>
  <textarea
    id="{uid}-input"
    bind:this={textarea}
    bind:value
    onkeydown={onKeydown}
    rows="2"
    {placeholder}
    class="block min-h-[44px] w-full resize-none bg-transparent pr-1 text-[13.5px] leading-relaxed text-moon-bright placeholder:text-star-dim focus:outline-none"
  ></textarea>
  <div class="flex items-center justify-between gap-2">
    <div class="flex min-w-0 items-center gap-1">
      {#if tools}{@render tools()}{/if}
      {#if hint}<span class="truncate pl-1 font-mono text-[11px] text-star-dim">{hint}</span>{/if}
    </div>
    <div class="flex items-center gap-1.5">
      {#if generating}
        <button
          type="button"
          onclick={onStop}
          aria-label="Stop generating"
          title="Stop generating (esc)"
          class="flex h-8 w-8 items-center justify-center rounded-[9px] bg-moon-bright text-night-900 transition-transform active:translate-y-px"
        >
          <Square class="h-3 w-3 fill-current" />
        </button>
      {/if}
      {#if !generating || canQueue}
        <button
          type="button"
          onclick={send}
          disabled={!canSend}
          aria-label={generating ? 'Queue change' : 'Send'}
          class={cn(
            'flex h-8 w-8 items-center justify-center rounded-[9px] transition-colors',
            canSend ? 'bg-moon-bright text-night-900' : 'bg-moon/[0.08] text-star-dim'
          )}
        >
          <ArrowUp class="h-4 w-4" strokeWidth={2.4} />
        </button>
      {/if}
    </div>
  </div>
</div>
