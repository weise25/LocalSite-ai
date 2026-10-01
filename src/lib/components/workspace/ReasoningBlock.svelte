<script lang="ts">
  import { tick } from 'svelte';
  import { ChevronRight, Sparkles } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import { formatDuration } from '$lib/state/session.svelte';

  interface Props {
    text: string;
    /** Still receiving reasoning tokens */
    live?: boolean;
    startedAt?: number;
    durationMs?: number;
  }

  let { text, live = false, startedAt = 0, durationMs = 0 }: Props = $props();

  let open = $state(false);
  let body = $state<HTMLDivElement>();
  let now = $state(Date.now());
  const uid = $props.id();

  $effect(() => {
    if (!live) return;
    now = Date.now();
    const timer = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(timer);
  });

  // Follow the newest thought while it streams
  $effect(() => {
    void text;
    if (live) void tick().then(() => body && (body.scrollTop = body.scrollHeight));
  });

  const seconds = $derived(Math.max(1, Math.round((live ? now - startedAt : durationMs) / 1000)));
</script>

{#if live}
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2 text-[12.5px] text-gold">
      <Sparkles class="h-3.5 w-3.5" />
      Thinking
      <span class="font-mono text-[11px] text-thought-dim">{formatDuration(now - startedAt)}</span>
    </div>
    <div
      bind:this={body}
      class="max-h-[132px] overflow-hidden whitespace-pre-wrap rounded-xl border border-gold/[0.12] bg-gold/[0.04] px-3 py-2.5 font-mono text-[11.5px] leading-[1.7] text-thought"
      style="mask-image: linear-gradient(180deg, transparent 0, #000 36px); -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 36px)"
    >
      {text}<span class="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-gold motion-safe:animate-caret-blink"></span>
    </div>
  </div>
{:else if text}
  <div class="flex flex-col gap-2">
    <button
      type="button"
      onclick={() => (open = !open)}
      aria-expanded={open}
      aria-controls="{uid}-thoughts"
      class="flex items-center gap-1.5 self-start text-[12.5px] text-thought-dim transition-colors hover:text-gold"
    >
      <ChevronRight class={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')} />
      Thought for {seconds}s
    </button>
    {#if open}
      <div
        id="{uid}-thoughts"
        class="max-h-[260px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-gold/[0.1] bg-gold/[0.03] px-3 py-2.5 font-mono text-[11.5px] leading-[1.7] text-thought animate-in fade-in-0"
      >
        {text}
      </div>
    {/if}
  </div>
{/if}
