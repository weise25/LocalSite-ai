<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { ChevronDown } from '@lucide/svelte';
  import { cn } from '$lib/utils';
    import ModelPicker from './ModelPicker.svelte';
  import ModeMenu from './ModeMenu.svelte';
  import TokensMenu from './TokensMenu.svelte';
  import { providerStore } from '$lib/state/providers.svelte';
  import { hasMod, modKey } from '$lib/client/platform';

  interface Props {
    prompt: string;
    provider: string;
    model: string;
    systemPrompt: string;
    customSystemPrompt: string;
    maxTokens: number | undefined;
    onGenerate: () => void;
  }

  let {
    prompt = $bindable(''),
    provider = $bindable(''),
    model = $bindable(''),
    systemPrompt = $bindable('default'),
    customSystemPrompt = $bindable(''),
    maxTokens = $bindable(),
    onGenerate
  }: Props = $props();

  let textarea = $state<HTMLTextAreaElement>();
  let root = $state<HTMLDivElement>();
  let picker = $state<ReturnType<typeof ModelPicker>>();

  let pickerOpen = $state(false);
  let pickerVia = $state<'at' | 'chip'>('chip');
  let atStart = $state(0);
  let atQuery = $state('');
  let mod = $state('⌘');

  const providerInfo = $derived(providerStore.byId(provider));
  const providerStatus = $derived(providerStore.status[provider]);
  const canGenerate = $derived(
    !!prompt.trim() && !!model && !!provider && (systemPrompt !== 'custom' || !!customSystemPrompt.trim())
  );
  const blockedReason = $derived(
    !prompt.trim()
      ? 'Describe what you want to build'
      : !model
        ? 'Choose a model first'
        : systemPrompt === 'custom' && !customSystemPrompt.trim()
          ? 'Enter a custom system prompt'
          : ''
  );

  onMount(() => {
    mod = modKey();
    resize();
  });

  // Keep the textarea height in step with external prompt changes (starters, reset)
  $effect(() => {
    void prompt;
    void tick().then(resize);
  });

  function resize() {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 320)}px`;
  }

  function detectMention() {
    if (!textarea) return;
    const caret = textarea.selectionStart ?? prompt.length;
    const before = prompt.slice(0, caret);
    const match = before.match(/(^|\s)@([^\s@]*)$/);
    if (match) {
      atQuery = match[2];
      atStart = caret - match[2].length - 1;
      pickerVia = 'at';
      pickerOpen = true;
    } else if (pickerVia === 'at' && pickerOpen) {
      pickerOpen = false;
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (pickerOpen && pickerVia === 'at' && picker?.handleKey(event)) return;
    if (event.key === 'Enter' && hasMod(event)) {
      event.preventDefault();
      if (canGenerate) onGenerate();
    }
  }

  function openPicker() {
    if (pickerOpen && pickerVia === 'chip') {
      pickerOpen = false;
      return;
    }
    pickerVia = 'chip';
    atQuery = '';
    pickerOpen = true;
  }

  async function closePicker() {
    pickerOpen = false;
    await tick();
    textarea?.focus();
  }

  async function handleSelect(nextProvider: string, nextModel: string) {
    provider = nextProvider;
    model = nextModel;
    if (pickerVia === 'at') {
      // Remove the "@query" that opened the picker
      const end = atStart + 1 + atQuery.length;
      let before = prompt.slice(0, atStart);
      const after = prompt.slice(end);
      if (before.endsWith(' ') && (after.startsWith(' ') || after === '')) before = before.slice(0, -1);
      prompt = before + after;
      await closePicker();
      textarea?.setSelectionRange(before.length, before.length);
    } else {
      await closePicker();
    }
  }

  function onWindowPointerDown(event: PointerEvent) {
    if (pickerOpen && root && !root.contains(event.target as Node)) pickerOpen = false;
  }

  export function focus() {
    textarea?.focus();
    const end = prompt.length;
    textarea?.setSelectionRange(end, end);
  }
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

<div bind:this={root} class="glass glass-edge relative w-full rounded-[22px]">
  <div class="px-5 pb-1 pt-5 sm:px-6 sm:pt-[22px]">
    <label for="prompt-input" class="sr-only">Describe the website you want to build</label>
    <textarea
      id="prompt-input"
      bind:this={textarea}
      bind:value={prompt}
      oninput={() => {
        resize();
        detectMention();
      }}
      onkeydown={onKeydown}
      onclick={detectMention}
      rows="3"
      placeholder="A landing page for a night-time ramen bar in Osaka — moody, neon, with a menu and a map…"
      aria-describedby="prompt-hints"
      class="block max-h-80 min-h-[88px] w-full resize-none bg-transparent text-[16px] leading-relaxed text-moon-bright placeholder:text-star-dim focus:outline-none sm:text-[18px]"
    ></textarea>
  </div>

  {#if pickerOpen}
    <div class="border-t border-moon/[0.08] animate-in fade-in-0 slide-in-from-top-1">
      <ModelPicker
        bind:this={picker}
        query={pickerVia === 'at' ? atQuery : ''}
        withSearch={pickerVia === 'chip'}
        {provider}
        {model}
        onSelect={handleSelect}
        onClose={closePicker}
      />
    </div>
  {:else}
    <div class="flex flex-col gap-3 px-3.5 pb-3.5 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pl-[18px]">
      <div class="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 sm:flex-wrap sm:overflow-visible">
        <button
          type="button"
          class="chip max-w-[320px]"
          onclick={openPicker}
          aria-haspopup="listbox"
          aria-expanded={pickerOpen}
        >
          <span
            class={cn(
              'h-[7px] w-[7px] shrink-0 rounded-full',
              providerInfo?.isLocal && providerStatus === 'ready'
                ? 'bg-aurora shadow-[0_0_8px_#7DD3C0]'
                : providerStatus === 'error'
                  ? 'border border-ember'
                  : 'bg-star-muted'
            )}
          ></span>
          {#if providerInfo}
            <span>{providerInfo.name}</span>
            <span class="text-star-faint">/</span>
          {/if}
          <span class="truncate font-mono text-[12px] text-moon-bright">
            {model || (providerStatus === 'loading' ? 'loading models…' : 'choose a model')}
          </span>
          <ChevronDown class="h-3 w-3 shrink-0 text-star-dim" />
        </button>
        <ModeMenu bind:mode={systemPrompt} bind:customSystemPrompt />
        <TokensMenu bind:maxTokens />
      </div>

      <button
        type="button"
        class="btn-moon group flex h-12 shrink-0 items-center justify-center gap-3 rounded-[12px] pl-5 pr-2.5 text-[15px] font-semibold sm:h-[46px] sm:text-[14px]"
        disabled={!canGenerate}
        title={blockedReason || undefined}
        onclick={onGenerate}
      >
        Generate
        <kbd class="kbd border-night-900/10 bg-night-900/[0.08] text-night-600 group-disabled:border-moon/10 group-disabled:bg-transparent group-disabled:text-star-dim">{mod}↵</kbd>
      </button>
    </div>
  {/if}
</div>

<p id="prompt-hints" class="sr-only">
  Type @ to choose a provider and model. Press {mod} Enter to generate.
</p>

