<script lang="ts">
  import { untrack, onDestroy } from 'svelte';
  import type { Snippet } from 'svelte';
  import { ExternalLink, Laptop, RefreshCw, Smartphone, Tablet } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import MoonPhase from '$lib/components/night/MoonPhase.svelte';

  interface Props {
    generationComplete: boolean;
    viewportSize: 'desktop' | 'tablet' | 'mobile';
    originalCode: string;
    editedCode: string;
    isGenerating: boolean;
    previewKey: number;
    previewContent: string;
    refreshPreview: () => void;
    setViewportSize: (size: 'desktop' | 'tablet' | 'mobile') => void;
    /** Short status shown in the toolbar pill, e.g. "live · v3" */
    label?: string;
    /** Current line count while streaming, shown on the write-head */
    writingLine?: number;
    onOpenTab?: () => void;
    /** Replaces the live frames (e.g. version compare) */
    override?: Snippet;
    /** Extra toolbar controls */
    toolbarExtra?: Snippet;
    /** Exposes the two buffered iframes (for the element picker) */
    onFrames?: (frames: (HTMLIFrameElement | undefined)[]) => void;
    class?: string;
  }

  let {
    generationComplete,
    viewportSize,
    originalCode,
    editedCode,
    isGenerating,
    previewKey,
    previewContent,
    refreshPreview,
    setViewportSize,
    label = '',
    writingLine = 0,
    onOpenTab,
    override,
    toolbarExtra,
    onFrames,
    class: className = ''
  }: Props = $props();

  const viewports = [
    { id: 'desktop', label: 'Desktop view', icon: Laptop },
    { id: 'tablet', label: 'Tablet view', icon: Tablet },
    { id: 'mobile', label: 'Mobile view', icon: Smartphone }
  ] as const;

  const iframeWidthClass = $derived(
    viewportSize === 'desktop'
      ? 'w-full h-full'
      : viewportSize === 'tablet'
        ? 'w-[768px] max-w-full h-full'
        : 'w-[375px] max-w-full h-full'
  );

  // --- Double Buffering State ---
  let activeFrame = $state<1 | 2>(1);
  let content1 = $state('');
  let content2 = $state('');

  let iframe1 = $state<HTMLIFrameElement>();
  let iframe2 = $state<HTMLIFrameElement>();

  $effect(() => {
    onFrames?.([iframe1, iframe2]);
  });

  // Manual opacity and z-index control for seamless crossfading
  let opacity1 = $state(1);
  let opacity2 = $state(0);
  let zIndex1 = $state(20);
  let zIndex2 = $state(10);
  let pointerEvents1 = $state<'auto' | 'none'>('auto');
  let pointerEvents2 = $state<'auto' | 'none'>('none');

  let swapTimeout: ReturnType<typeof setTimeout>;
  let fadeOutTimeout: ReturnType<typeof setTimeout>;
  let previousKey = -1;
  let skipNextScrollSync = false;

  // allow-scripts: run generated preview JS. allow-forms: interactive form elements.
  // allow-same-origin: parent reads contentWindow.scrollX/Y to sync scroll between
  // double-buffered iframes during seamless preview swaps (see handleIframeLoad).
  const iframeSandbox = 'allow-scripts allow-forms allow-same-origin';

  onDestroy(() => {
    clearTimeout(swapTimeout);
    clearTimeout(fadeOutTimeout);
  });

  // Trigger swap on content change OR explicit refresh (previewKey)
  $effect(() => {
    const currentKey = previewKey;
    const baseHtml = previewContent;
    
    if (!baseHtml) return;

    // Force strict inequality so Svelte always updates the srcdoc,
    // ensuring the hidden iframe actually reloads and reinitializes JS.
    const html = baseHtml + `\n<!-- update: ${Date.now()}-${Math.random()} -->`;

    untrack(() => {
      if (currentKey !== previousKey) {
        skipNextScrollSync = true;
        previousKey = currentKey;
      } else {
        skipNextScrollSync = false;
      }

      clearTimeout(swapTimeout);

      if (activeFrame === 1) {
        content2 = html;
        swapTimeout = setTimeout(() => handleIframeLoad(2), 400);
      } else {
        content1 = html;
        swapTimeout = setTimeout(() => handleIframeLoad(1), 400);
      }
    });
  });

  function handleIframeLoad(frameNumber: number) {
    clearTimeout(swapTimeout);
    clearTimeout(fadeOutTimeout);
    
    try {
      if (activeFrame === 1 && frameNumber === 2) {
        if (!skipNextScrollSync && iframe1?.contentWindow && iframe2?.contentWindow) {
          iframe2.contentWindow.scrollTo({
            top: iframe1.contentWindow.scrollY,
            left: iframe1.contentWindow.scrollX,
            behavior: 'instant'
          });
        }
        activeFrame = 2;
        zIndex2 = 20; // New frame on top
        zIndex1 = 10; // Old frame underneath
        pointerEvents2 = 'auto';
        pointerEvents1 = 'none';
        opacity2 = 1; // Fade in new frame
        
        // Keep old frame fully opaque until new frame finishes fading in
        fadeOutTimeout = setTimeout(() => {
          opacity1 = 0;
        }, 200);

      } else if (activeFrame === 2 && frameNumber === 1) {
        if (!skipNextScrollSync && iframe1?.contentWindow && iframe2?.contentWindow) {
          iframe1.contentWindow.scrollTo({
            top: iframe2.contentWindow.scrollY,
            left: iframe2.contentWindow.scrollX,
            behavior: 'instant'
          });
        }
        activeFrame = 1;
        zIndex1 = 20; // New frame on top
        zIndex2 = 10; // Old frame underneath
        pointerEvents1 = 'auto';
        pointerEvents2 = 'none';
        opacity1 = 1; // Fade in new frame
        
        // Keep old frame fully opaque until new frame finishes fading in
        fadeOutTimeout = setTimeout(() => {
          opacity2 = 0;
        }, 200);
      }
    } catch (e) {
      activeFrame = frameNumber as 1 | 2;
      // Fallback
      if (activeFrame === 1) {
        opacity1 = 1; opacity2 = 0; zIndex1 = 20; zIndex2 = 10;
        pointerEvents1 = 'auto'; pointerEvents2 = 'none';
      } else {
        opacity1 = 0; opacity2 = 1; zIndex1 = 10; zIndex2 = 20;
        pointerEvents1 = 'none'; pointerEvents2 = 'auto';
      }
    }
    skipNextScrollSync = false;
  }
</script>

<section class={cn('glass flex h-full min-h-0 flex-col overflow-hidden rounded-2xl', className)} aria-label="Preview">
  <div class="flex h-[42px] shrink-0 items-center justify-between gap-2 border-b border-moon/[0.07] px-2">
    <div class="flex rounded-[9px] bg-night-950/50 p-[3px]" role="group" aria-label="Viewport">
      {#each viewports as vp (vp.id)}
        <button
          type="button"
          aria-label={vp.label}
          aria-pressed={viewportSize === vp.id}
          onclick={() => setViewportSize(vp.id)}
          class={cn(
            'flex h-[26px] w-8 items-center justify-center rounded-[7px] transition-colors',
            viewportSize === vp.id ? 'bg-moon/10 text-moon-bright' : 'text-star-dim hover:text-star-2'
          )}
        >
          <vp.icon class="h-3.5 w-3.5" />
        </button>
      {/each}
    </div>

    {#if label}
      <span class="flex h-7 min-w-0 items-center gap-2 truncate rounded-lg bg-night-950/50 px-3 font-mono text-[11.5px] text-star-muted">
        {#if isGenerating}
          <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-gold motion-safe:animate-pulse"></span>
        {/if}
        {label}
      </span>
    {/if}

    <div class="flex items-center gap-0.5">
      {#if toolbarExtra}{@render toolbarExtra()}{/if}
      <button
        type="button"
        onclick={refreshPreview}
        disabled={!generationComplete}
        aria-label="Reload preview"
        title="Reload preview"
        class="flex h-7 w-8 items-center justify-center rounded-[7px] text-star-dim transition-colors hover:bg-moon/[0.07] hover:text-star disabled:opacity-40"
      >
        <RefreshCw class="h-3.5 w-3.5" />
      </button>
      {#if onOpenTab}
        <button
          type="button"
          onclick={onOpenTab}
          disabled={!originalCode && !editedCode}
          aria-label="Open in new tab"
          title="Open in new tab"
          class="flex h-7 w-8 items-center justify-center rounded-[7px] text-star-dim transition-colors hover:bg-moon/[0.07] hover:text-star disabled:opacity-40"
        >
          <ExternalLink class="h-3.5 w-3.5" />
        </button>
      {/if}
    </div>
  </div>

  <!-- Iframe Viewport Area -->
  <div class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3 sm:p-[18px]">
    {#if override}
      {@render override()}
    {:else}
      <div
        class="h-full overflow-hidden rounded-xl bg-night-900 shadow-[0_0_0_1px_rgba(199,210,254,.14),0_40px_80px_-30px_rgba(0,0,0,.95),0_0_60px_-20px_rgba(140,160,240,.25)] transition-all duration-300 {iframeWidthClass}"
      >
        {#if !originalCode && !editedCode}
          <div class="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
            {#if isGenerating}
              <MoonPhase phase="waxing" size={34} />
              <p class="text-[13px] text-star-muted">The page appears here as it is written.</p>
            {:else}
              <MoonPhase phase="new" size={34} />
              <p class="text-[13px] text-star-dim">No preview yet.</p>
            {/if}
          </div>
        {:else}
          <div class="relative h-full w-full">
            <iframe
              bind:this={iframe1}
              srcdoc={content1}
              onload={() => handleIframeLoad(1)}
              class="absolute inset-0 h-full w-full transition-opacity duration-200 ease-in-out"
              title="Preview 1"
              sandbox={iframeSandbox}
              style="background-color: #121212; opacity: {opacity1}; z-index: {zIndex1}; pointer-events: {pointerEvents1};"
            ></iframe>
            <iframe
              bind:this={iframe2}
              srcdoc={content2}
              onload={() => handleIframeLoad(2)}
              class="absolute inset-0 h-full w-full transition-opacity duration-200 ease-in-out"
              title="Preview 2"
              sandbox={iframeSandbox}
              style="background-color: #121212; opacity: {opacity2}; z-index: {zIndex2}; pointer-events: {pointerEvents2};"
            ></iframe>

            {#if isGenerating}
              <!-- Write-head: new markup lands at the end of the document -->
              <div class="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-14 overflow-hidden">
                <div
                  class="absolute inset-x-0 bottom-0 h-14 border-b border-moon-bright motion-safe:animate-scan"
                  style="background: linear-gradient(180deg, transparent, rgba(199,210,254,.12) 80%, rgba(238,241,255,.45) 100%)"
                ></div>
              </div>
              <span
                class="absolute bottom-3 right-3 z-30 rounded-md bg-night-950/80 px-2 py-1 font-mono text-[10.5px] text-moon backdrop-blur"
              >
                writing{writingLine ? ` · line ${writingLine}` : '…'}
              </span>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</section>
