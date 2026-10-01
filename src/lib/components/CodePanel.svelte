<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Check, Copy, Lock, PenLine, Undo2 } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import Kbd from '$lib/components/ui/Kbd.svelte';
  import MoonPhase from '$lib/components/night/MoonPhase.svelte';
  import CodeEditor from '$lib/components/CodeEditor.svelte';
  import type { GenerationStatus } from '$lib/state/code-generation.svelte';

  interface Props {
    code: string;
    status: GenerationStatus;
    isGenerating: boolean;
    canEdit: boolean;
    isEditable: boolean;
    hasChanges: boolean;
    copySuccess: boolean;
    mod: string;
    /** Label next to the file name, e.g. "v3" or "viewing v2" */
    versionLabel?: string;
    toolbarExtra?: Snippet;
    /** Replaces the editor (e.g. a diff view) */
    override?: Snippet;
    setEditable: (value: boolean) => void;
    onEditedCodeChange: (value: string) => void;
    onSave: () => void;
    onDiscard: () => void;
    onCopy: () => void;
    class?: string;
  }

  let {
    code,
    status,
    isGenerating,
    canEdit,
    isEditable,
    hasChanges,
    copySuccess,
    mod,
    versionLabel = '',
    toolbarExtra,
    override,
    setEditable,
    onEditedCodeChange,
    onSave,
    onDiscard,
    onCopy,
    class: className = ''
  }: Props = $props();

  const dot = $derived(
    isGenerating ? 'bg-gold' : status === 'stopped' ? 'bg-gold/60' : status === 'error' ? 'bg-ember' : 'bg-aurora'
  );
</script>

<section class={cn('glass flex h-full min-h-0 flex-col overflow-hidden rounded-2xl', className)} aria-label="Code">
  <div class="flex h-[42px] shrink-0 items-center justify-between gap-2 border-b border-moon/[0.07] pl-1.5 pr-2">
    <div class="flex min-w-0 items-center gap-2">
      <span class="flex h-[30px] items-center gap-2 rounded-lg bg-moon/[0.07] px-3 font-mono text-[12px] text-moon-bright">
        index.html
        <span class={cn('h-1.5 w-1.5 rounded-full', dot)}></span>
      </span>
      {#if versionLabel}
        <span class="truncate font-mono text-[11px] text-star-dim">{versionLabel}</span>
      {/if}
    </div>

    <div class="flex items-center gap-1.5">
      {#if isGenerating}
        <span class="hidden items-center gap-1.5 font-mono text-[11px] text-star-dim sm:flex">
          <Lock class="h-3 w-3" /> read-only while writing
        </span>
      {:else if isEditable}
        <span class="hidden items-center gap-1.5 font-mono text-[11px] text-star-muted md:flex">
          <span class="text-aurora">●</span> editing
        </span>
        {#if hasChanges}
          <button type="button" class="chip h-7 px-2.5 text-[12px]" onclick={onDiscard}>
            <Undo2 class="h-3.5 w-3.5" /> Discard
          </button>
          <button
            type="button"
            class="btn-moon flex h-7 items-center gap-1.5 rounded-[8px] px-2.5 text-[12px] font-semibold"
            onclick={onSave}
          >
            Save <Kbd class="h-4 border-night-900/10 bg-night-900/[0.08] text-night-600">{mod}S</Kbd>
          </button>
        {:else}
          <button type="button" class="chip h-7 px-2.5 text-[12px]" onclick={() => setEditable(false)}>Done</button>
        {/if}
      {:else if canEdit}
        <button type="button" class="chip h-7 px-2.5 text-[12px]" onclick={() => setEditable(true)}>
          <PenLine class="h-3.5 w-3.5" /> Edit
        </button>
      {/if}
      {#if toolbarExtra}{@render toolbarExtra()}{/if}
      <button
        type="button"
        onclick={onCopy}
        disabled={!code || isGenerating}
        aria-label={copySuccess ? 'Copied' : 'Copy code'}
        title="Copy code"
        class="flex h-7 w-8 items-center justify-center rounded-[7px] text-star-dim transition-colors hover:bg-moon/[0.07] hover:text-star disabled:opacity-40"
      >
        {#if copySuccess}<Check class="h-4 w-4 text-aurora" />{:else}<Copy class="h-4 w-4" />{/if}
      </button>
    </div>
  </div>

  <div class="relative min-h-0 flex-1">
    {#if override}
      {@render override()}
    {:else if isGenerating && !code}
      <div class="flex h-full flex-col items-center justify-center gap-3 text-center">
        <MoonPhase phase="waxing" size={28} />
        <p class="text-[13px] text-star-muted">The first lines are on their way…</p>
      </div>
    {:else}
      <CodeEditor
        {code}
        isEditable={isEditable && canEdit}
        streaming={isGenerating}
        onChange={onEditedCodeChange}
        {onSave}
      />
    {/if}
  </div>
</section>
