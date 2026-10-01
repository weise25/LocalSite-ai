<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import { RotateCw } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import MoonPhase from '$lib/components/night/MoonPhase.svelte';
  import ReasoningBlock from './ReasoningBlock.svelte';
  import Composer from './Composer.svelte';
  import { deriveSteps } from '$lib/generation/steps';
  import { formatDuration, type Session, type Version } from '$lib/state/session.svelte';
  import type { GenerationStatus } from '$lib/state/code-generation.svelte';

  interface Props {
    session: Session;
    status: GenerationStatus;
    generating: boolean;
    isThinking: boolean;
    thinkingOutput: string;
    thinkingStartedAt: number;
    thinkingEndedAt: number;
    code: string;
    composerValue: string;
    composerPlaceholder?: string;
    composerHint?: string;
    canQueue?: boolean;
    composerTools?: Snippet;
    composerAbove?: Snippet;
    header?: Snippet;
    onSend: (text: string) => void;
    onStop: () => void;
    onRetry: () => void;
    onViewVersion?: (n: number) => void;
    class?: string;
  }

  let {
    session,
    status,
    generating,
    isThinking,
    thinkingOutput,
    thinkingStartedAt,
    thinkingEndedAt,
    code,
    composerValue = $bindable(''),
    composerPlaceholder,
    composerHint,
    canQueue = false,
    composerTools,
    composerAbove,
    header,
    onSend,
    onStop,
    onRetry,
    onViewVersion,
    class: className = ''
  }: Props = $props();

  let scroller = $state<HTMLDivElement>();
  let composer = $state<ReturnType<typeof Composer>>();

  const steps = $derived(
    deriveSteps(code, {
      generating,
      complete: false,
      reasoning: !!thinkingOutput,
      thinking: isThinking
    })
  );

  const showPending = $derived(!!session.pendingPrompt);
  const latestN = $derived(session.latest?.n ?? null);

  // Keep the newest activity in view
  $effect(() => {
    void session.versions.length;
    void session.pendingPrompt;
    void steps.length;
    void tick().then(() => scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' }));
  });

  export function focusComposer() {
    composer?.focus();
  }

  function versionMeta(v: Version) {
    const parts = [`${v.lines} lines`];
    if (v.durationMs) parts.push(formatDuration(v.durationMs));
    return parts.join(' · ');
  }
</script>

{#snippet userBubble(text: string)}
  <div
    class="max-w-[92%] self-end whitespace-pre-wrap break-words rounded-[14px_14px_4px_14px] border border-moon/10 bg-moon/[0.09] px-3.5 py-2.5 text-[13.5px] leading-normal text-moon-bright"
  >
    {text}
  </div>
{/snippet}

<section class={cn('glass flex h-full min-h-0 flex-col overflow-hidden rounded-2xl', className)} aria-label="Thread">
  {#if header}
    {@render header()}
  {:else}
    <div class="flex h-[42px] shrink-0 items-center justify-between border-b border-moon/[0.07] px-4">
      <span class="text-[12.5px] text-moon-bright">Thread</span>
      <span class="font-mono text-[11px] text-star-dim">{session.versions.length} version{session.versions.length === 1 ? '' : 's'}</span>
    </div>
  {/if}

  <div bind:this={scroller} class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-2 pt-4">
    {#each session.versions as v (v.n)}
      {#if !v.manual}{@render userBubble(v.prompt)}{/if}
      <div class="flex flex-col gap-2.5">
        {#if v.thinking}
          <ReasoningBlock text={v.thinking} durationMs={v.thinkingMs} />
        {/if}
        <button
          type="button"
          onclick={() => onViewVersion?.(v.n)}
          disabled={!onViewVersion || generating}
          aria-pressed={session.viewing === v.n || (session.viewing === null && v.n === latestN && !showPending)}
          class={cn(
            'flex items-center gap-3 rounded-[14px] border p-2.5 text-left transition-colors',
            session.viewing === v.n || (session.viewing === null && v.n === latestN && !showPending)
              ? 'border-moon/20 bg-gradient-to-b from-moon/[0.08] to-moon/[0.03]'
              : 'border-moon/[0.08] bg-night-950/40 enabled:hover:border-moon/[0.16]'
          )}
        >
          <span class="flex h-[38px] w-[52px] shrink-0 items-center justify-center rounded-lg bg-night-950/70 shadow-[inset_0_0_0_1px_rgba(199,210,254,.08)]">
            <MoonPhase phase={v.stopped ? 'half' : 'full'} size={16} />
          </span>
          <span class="flex min-w-0 flex-col gap-0.5">
            <span class="flex items-center gap-2 text-[13px] font-medium text-moon-bright">
              Version {v.n}
              {#if v.manual}<span class="font-mono text-[10.5px] font-normal text-star-dim">edited by hand</span>{/if}
              {#if v.stopped}<span class="font-mono text-[10.5px] font-normal text-gold">stopped early</span>{/if}
            </span>
            <span class="font-mono text-[11px] text-star-muted">
              {versionMeta(v)}
              {#if v.n > 1 || v.manual}
                · <span class="text-aurora">+{v.added}</span> <span class="text-ember">−{v.removed}</span>
              {/if}
            </span>
          </span>
        </button>
      </div>
    {/each}

    {#if showPending}
      {@render userBubble(session.pendingPrompt)}
      <div class="flex flex-col gap-3">
        {#if thinkingOutput}
          <ReasoningBlock
            text={thinkingOutput}
            live={isThinking}
            startedAt={thinkingStartedAt}
            durationMs={(thinkingEndedAt || Date.now()) - thinkingStartedAt}
          />
        {/if}
        {#if status === 'error'}
          <div class="rounded-[14px] border border-ember/25 bg-ember/[0.05] p-3 text-[13px] text-star-2">
            <p class="text-ember">This one didn't make it.</p>
            <p class="mt-1 text-star-muted">Check the provider and try again.</p>
            <button type="button" class="chip mt-2.5" onclick={onRetry}>
              <RotateCw class="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        {:else}
          <ul class="flex flex-col gap-2 px-0.5" aria-label="Progress">
            {#each steps as step (step.id)}
              <li
                class={cn(
                  'flex items-center gap-2.5 text-[12.5px]',
                  step.state === 'active' ? 'text-moon-bright' : step.state === 'done' ? 'text-star-muted' : 'text-star-faint'
                )}
              >
                <span
                  class={cn(
                    'h-3.5 w-3.5 shrink-0 rounded-full border',
                    step.state === 'done' && 'border-star-muted bg-star-muted',
                    step.state === 'active' && 'border-gold shadow-[0_0_10px_rgba(242,212,138,.5)] motion-safe:animate-pulse',
                    step.state === 'pending' && 'border-star-faint'
                  )}
                ></span>
                {step.label}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}

    {#if !session.versions.length && !showPending}
      <p class="m-auto max-w-[220px] text-center text-[12.5px] text-star-dim">Nothing here yet.</p>
    {/if}
  </div>

  <div class="shrink-0 p-2.5">
    <Composer
      bind:this={composer}
      bind:value={composerValue}
      {generating}
      {canQueue}
      placeholder={composerPlaceholder}
      hint={composerHint}
      tools={composerTools}
      above={composerAbove}
      {onSend}
      {onStop}
    />
  </div>
</section>
