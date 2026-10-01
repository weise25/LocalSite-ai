<script lang="ts">
  import { Check, Sparkles, SquarePen } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import Popover from '$lib/components/ui/Popover.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';

  interface Props {
    mode: string;
    customSystemPrompt: string;
    side?: 'top' | 'bottom';
  }

  let { mode = $bindable('default'), customSystemPrompt = $bindable(''), side = 'bottom' }: Props = $props();

  let open = $state(false);
  let dialogOpen = $state(false);
  let draft = $state('');

  const items = [
    { value: 'default', label: 'Default', description: 'Straight to code' },
    { value: 'thinking', label: 'Thinking', description: 'Reason first, shown live in gold' },
    { value: 'custom', label: 'Custom system prompt', description: 'Bring your own instructions' }
  ];

  const label = $derived(
    mode === 'thinking' ? 'Thinking' : mode === 'custom' ? 'Custom prompt' : 'Default'
  );

  function pick(value: string, close: () => void) {
    close();
    if (value === 'custom') {
      draft = customSystemPrompt;
      dialogOpen = true;
      return;
    }
    mode = value;
  }

  function saveCustom() {
    customSystemPrompt = draft.trim();
    mode = customSystemPrompt ? 'custom' : mode === 'custom' ? 'default' : mode;
    dialogOpen = false;
  }
</script>

<Popover bind:open {side} label="Generation mode" panelClass="w-[280px]">
  {#snippet trigger({ toggle, open: isOpen, id })}
    <button
      type="button"
      class={cn(
        'chip',
        mode === 'thinking' && 'border-gold/25 bg-gold/[0.06] text-gold hover:border-gold/40 hover:bg-gold/10 hover:text-gold',
        mode === 'custom' && 'border-moon/25 text-moon-bright'
      )}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls={id}
      onclick={toggle}
    >
      {#if mode === 'custom'}
        <SquarePen class="h-3.5 w-3.5" />
      {:else}
        <Sparkles class="h-3.5 w-3.5" />
      {/if}
      {label}
    </button>
  {/snippet}
  {#snippet children({ close })}
    {#each items as item (item.value)}
      <button
        type="button"
        onclick={() => pick(item.value, close)}
        class="flex w-full items-start gap-2.5 rounded-[10px] px-2.5 py-2 text-left hover:bg-moon/[0.07]"
      >
        <Check class={cn('mt-0.5 h-4 w-4 shrink-0 text-moon', mode === item.value ? 'opacity-100' : 'opacity-0')} />
        <span class="flex flex-col gap-0.5">
          <span class="text-[13.5px] text-star">{item.label}</span>
          <span class="text-[12px] text-star-muted">{item.description}</span>
        </span>
      </button>
    {/each}
  {/snippet}
</Popover>

<Dialog bind:open={dialogOpen} labelledby="custom-prompt-title">
  <h2 id="custom-prompt-title" class="font-serif text-[28px] italic leading-none text-moon-bright">
    Custom system prompt
  </h2>
  <p class="mt-2 text-[13px] text-star-muted">
    Replaces the built-in instructions for this and every following generation.
  </p>
  <label for="custom-system-prompt" class="sr-only">Custom system prompt</label>
  <Textarea
    id="custom-system-prompt"
    bind:value={draft}
    placeholder="You are a meticulous front-end developer…"
    class="mt-4 min-h-[180px] text-[14px] leading-relaxed"
  />
  <div class="mt-5 flex justify-end gap-2">
    <Button variant="ghost" onclick={() => (dialogOpen = false)}>Cancel</Button>
    <Button onclick={saveCustom} disabled={!draft.trim() && mode !== 'custom'}>Use this prompt</Button>
  </div>
</Dialog>
