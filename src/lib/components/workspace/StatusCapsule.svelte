<script lang="ts">
  import { cn } from '$lib/utils';
  import MoonPhase from '$lib/components/night/MoonPhase.svelte';
  import type { GenerationStatus } from '$lib/state/code-generation.svelte';
  import { formatDuration, type Version } from '$lib/state/session.svelte';

  interface Props {
    status: GenerationStatus;
    isThinking: boolean;
    startedAt: number;
    endedAt: number;
    code: string;
    nextN: number;
    /** Version shown when idle */
    version?: Version;
    compact?: boolean;
    class?: string;
  }

  let { status, isThinking, startedAt, endedAt, code, nextN, version, compact = false, class: className = '' }: Props =
    $props();

  let now = $state(Date.now());

  $effect(() => {
    if (status !== 'generating') return;
    now = Date.now();
    const timer = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(timer);
  });

  const elapsed = $derived(status === 'generating' ? now - startedAt : endedAt - startedAt);
  const lines = $derived(code ? code.split('\n').length : 0);
  // Rough output speed; ~4 characters per token is the usual estimate
  const tokPerSec = $derived(elapsed > 1500 ? Math.round(code.length / 4 / (elapsed / 1000)) : 0);

  const label = $derived.by(() => {
    if (status === 'generating') return isThinking ? 'Thinking' : code ? `Writing v${nextN}` : 'Waking the model';
    if (status === 'stopped') return `Stopped at line ${lines}`;
    if (status === 'error') return 'Generation failed';
    if (version) return `v${version.n} ${version.manual ? 'saved' : 'landed'}`;
    return 'Ready';
  });
</script>

<div
  role="status"
  aria-live="polite"
  class={cn(
    'flex h-[38px] min-w-0 items-center gap-3 rounded-full border bg-night-950/60 pl-2 pr-4',
    status === 'error' ? 'border-ember/30' : 'border-moon/10',
    className
  )}
>
  <MoonPhase
    phase={status === 'generating' ? 'waxing' : status === 'done' || version ? 'full' : status === 'stopped' ? 'half' : 'new'}
    size={22}
  />
  <span class={cn('whitespace-nowrap text-[13px]', status === 'error' ? 'text-ember' : 'text-moon-bright')}>{label}</span>
  {#if !compact && (status !== 'idle' || version)}
    <span class="h-4 w-px bg-moon/[0.12]"></span>
    <span class="truncate font-mono text-[11.5px] text-star-muted">
      {#if status === 'generating'}
        {#if code}line {lines}{#if tokPerSec} · ≈{tokPerSec} tok/s{/if} · {/if}{formatDuration(elapsed)}
      {:else if version && status !== 'stopped' && status !== 'error'}
        {version.lines} lines
        {#if version.durationMs} · {formatDuration(version.durationMs)}{/if}
        {#if version.n > 1 || version.manual}
          · <span class="text-aurora">+{version.added}</span> <span class="text-ember">−{version.removed}</span>
        {/if}
      {:else}
        {formatDuration(elapsed)}
      {/if}
    </span>
  {/if}
</div>
