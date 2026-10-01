<script lang="ts">
  import { cn } from '$lib/utils';
  import Popover from '$lib/components/ui/Popover.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  interface Props {
    maxTokens: number | undefined;
    side?: 'top' | 'bottom';
  }

  let { maxTokens = $bindable(), side = 'bottom' }: Props = $props();

  let open = $state(false);
  const presets: (number | undefined)[] = [undefined, 4096, 8192, 16384, 32768, 65536];

  function short(n: number | undefined) {
    if (!n) return 'auto';
    return n >= 1024 && n % 1024 === 0 ? `${n / 1024}K` : n.toLocaleString();
  }

  function onInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    const value = raw ? parseInt(raw, 10) : undefined;
    maxTokens = value && !isNaN(value) && value > 0 ? value : undefined;
  }
</script>

<Popover bind:open {side} label="Max output tokens" panelClass="w-[260px] p-3">
  {#snippet trigger({ toggle, open: isOpen, id })}
    <button
      type="button"
      class={cn('chip', !maxTokens && 'text-star-muted')}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls={id}
      onclick={toggle}
    >
      Tokens · {short(maxTokens)}
    </button>
  {/snippet}
  <p class="label-mono mb-2.5">Max output tokens</p>
  <div class="grid grid-cols-3 gap-1.5">
    {#each presets as preset (preset ?? 0)}
      <button
        type="button"
        onclick={() => (maxTokens = preset)}
        class={cn(
          'h-8 rounded-[8px] border font-mono text-[12px] transition-colors',
          maxTokens === preset
            ? 'border-moon/30 bg-moon/[0.12] text-moon-bright'
            : 'border-moon/[0.08] text-star-2 hover:bg-moon/[0.06]'
        )}
      >
        {short(preset)}
      </button>
    {/each}
  </div>
  <label for="max-tokens" class="mt-3 block text-[12px] text-star-muted">Exact value</label>
  <Input
    id="max-tokens"
    type="number"
    min="100"
    step="100"
    value={maxTokens ?? ''}
    oninput={onInput}
    placeholder="Model default"
    class="mt-1.5 h-9 font-mono"
  />
  <p class="mt-2 text-[11.5px] leading-snug text-star-dim">
    Higher limits allow longer pages but take more time.
  </p>
</Popover>
