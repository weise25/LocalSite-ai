<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte';
  import { ArrowRightLeft, Crosshair, GitCompareArrows, History, Play, X } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { Pane, PaneGroup, PaneResizer } from 'paneforge';
  import { cn } from '$lib/utils';
  import Button from '$lib/components/ui/Button.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import NightSky from '$lib/components/night/NightSky.svelte';
  import MoonLogo from '$lib/components/night/MoonLogo.svelte';
  import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
  import StatusCapsule from '$lib/components/workspace/StatusCapsule.svelte';
  import ThreadPanel from '$lib/components/workspace/ThreadPanel.svelte';
  import CodePanel from '$lib/components/CodePanel.svelte';
  import PreviewPanel from '$lib/components/PreviewPanel.svelte';
  import DiffEditor from '$lib/components/DiffEditor.svelte';
  import CompareView from '$lib/components/workspace/CompareView.svelte';
  import { ELEMENT_PICKER_INJECTION, type PickedElement } from '$lib/client/element-picker';
  import type { CodeGeneration } from '$lib/state/code-generation.svelte';
  import type { Session } from '$lib/state/session.svelte';
  import { providerStore } from '$lib/state/providers.svelte';
  import { hasMod, modKey } from '$lib/client/platform';
  import { downloadHtml, openInNewTab } from '$lib/client/export';

  interface Props {
    gen: CodeGeneration;
    session: Session;
    model: string;
    provider?: string;
    onSend: (text: string, target: PickedElement | null) => void;
    onRetry: () => void;
    onStop: () => void;
    onRestart: () => void;
    onSaveEdit: (code: string) => void;
    onViewVersion: (n: number | null) => void;
    onRestoreVersion: (n: number) => void;
    /** Change waiting for the running generation to land */
    queued: { text: string; target: PickedElement | null } | null;
    onCancelQueue: () => void;
    onRunQueued: () => void;
  }

  let {
    gen,
    session,
    model,
    provider = '',
    onSend,
    onRetry,
    onStop,
    onRestart,
    onSaveEdit,
    onViewVersion,
    onRestoreVersion,
    queued,
    onCancelQueue,
    onRunQueued
  }: Props = $props();

  const canQueue = true;
  const previewInjection = ELEMENT_PICKER_INJECTION;

  const generatedCode = $derived(gen.generatedCode);
  const isGenerating = $derived(gen.isGenerating);
  const viewed = $derived(session.byN(session.viewing));
  // Version picked in the thread/header overrides the live output
  const shownCode = $derived(viewed ? viewed.code : generatedCode);
  const generationComplete = $derived(viewed ? true : gen.generationComplete);

  const injectedSetup = `
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; padding: 0; min-height: 100vh; }
  </style>
  <script>
    document.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (a) {
        const href = a.getAttribute('href') || '';

        if (href.startsWith('#')) {
          e.preventDefault();

          if (window.location.hash !== href && href !== '#') {
            window.location.hash = href;
          } else if (href === '#') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }

          if (href.length > 1) {
            try {
              const target = document.getElementById(href.substring(1));
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            } catch (err) {}
          }
          return;
        }

        e.preventDefault();
      }
    });
  <\/script>
`;

  function prepareHtmlContent(code: string): string {
    const fastForwardStyle = isGenerating ? `
      <style>
        * {
          animation-duration: 0.001s !important;
          animation-delay: 0s !important;
          transition-duration: 0.001s !important;
          transition-delay: 0s !important;
        }
      </style>
    ` : '';

    const injected = injectedSetup + fastForwardStyle + (isGenerating ? '' : previewInjection);

    if (/<\s*head[^>]*>/i.test(code)) {
      return code.replace(/<\s*head[^>]*>/i, (match) => `${match}${injected}`);
    } else if (/<\s*html[^>]*>/i.test(code)) {
      return code.replace(/<\s*html[^>]*>/i, (match) => `${match}<head>${injected}</head>`);
    }
    return `
      <!DOCTYPE html>
      <html>
        <head>${injected}</head>
        <body>${code}</body>
      </html>
    `;
  }

  // ---- Local view state ----
  let viewportSize = $state<'desktop' | 'tablet' | 'mobile'>('desktop');
  let copySuccess = $state(false);
  let activeTab = $state<'preview' | 'code' | 'thread'>('preview');
  let isEditable = $state(false);
  let editedCode = $state('');
  let originalCode = $state('');
  let previewKey = $state(0);
  let previewContent = $state('');
  let showSaveDialog = $state(false);
  let newPrompt = $state('');
  let isDesktop = $state(true);
  let mod = $state('⌘');

  onMount(() => {
    mod = modKey();
    const mq = window.matchMedia('(min-width: 1024px)');
    isDesktop = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      isDesktop = e.matches;
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  });

  const hasChanges = $derived(editedCode !== originalCode);
  const currentCode = $derived(isEditable ? editedCode : originalCode);
  const canExport = $derived(!!currentCode && !isGenerating);

  // ---- Debounced preview update ----
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let lastUpdateTime = 0;

  onDestroy(() => {
    clearTimeout(debounceTimer);
  });

  function flushPreview(code: string) {
    clearTimeout(debounceTimer);
    previewContent = prepareHtmlContent(code);
    lastUpdateTime = Date.now();
  }

  function syncGeneratedCode(code: string) {
    editedCode = code;
    originalCode = code;

    if (!code) {
      lastUpdateTime = 0;
      flushPreview(code);
      return;
    }

    const now = Date.now();

    // Immediate First Frame, and no throttling outside of streaming
    if (lastUpdateTime === 0 || !isGenerating) {
      flushPreview(code);
      return;
    }

    // Throttle during generation
    if (now - lastUpdateTime >= 1000) {
      flushPreview(code);
      return;
    }

    // Debounce for final chunk
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      flushPreview(code);
    }, 1000);
  }

  // When new code arrives (or another version is viewed), reset edit buffers and refresh preview
  $effect(() => {
    const code = shownCode;
    const generating = isGenerating;

    if (generating && !code) {
      editedCode = '';
      originalCode = '';
      lastUpdateTime = 0;
      flushPreview('');
      return;
    }

    if (code) {
      syncGeneratedCode(code);
    }
  });

  // Force a final flush when generation completes to remove fast-forward styles
  $effect(() => {
    void previewInjection;
    if (!isGenerating && shownCode) {
      untrack(() => flushPreview(isEditable ? editedCode : shownCode));
    }
  });

  // Leave edit mode when a generation starts
  $effect(() => {
    if (isGenerating) untrack(() => (isEditable = false));
  });

  const providerName = $derived(providerStore.byId(provider)?.name ?? provider);
  const lines = $derived(generatedCode ? generatedCode.split('\n').length : 0);
  const pendingN = $derived(session.pendingPrompt && (isGenerating || gen.status === 'error') ? session.nextN : null);

  const previewLabel = $derived(
    isGenerating
      ? `live · v${session.nextN}`
      : viewed
        ? `viewing v${viewed.n}`
        : session.latest
          ? `v${session.latest.n}`
          : ''
  );

  function saveChanges() {
    if (!hasChanges) return;
    onSaveEdit(editedCode);
    originalCode = editedCode;
  }

  function discardChanges() {
    editedCode = originalCode;
    flushPreview(originalCode);
  }

  function setEditable(value: boolean) {
    if (!value && hasChanges) {
      showSaveDialog = true;
      return;
    }
    if (value && viewed) onViewVersion?.(null);
    isEditable = value;
  }

  function copyToClipboard() {
    navigator.clipboard
      .writeText(currentCode)
      .then(() => {
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
      })
      .catch((err) => {
        console.error('Error copying:', err);
        toast.error('Failed to copy to clipboard');
      });
  }

  function refreshPreview() {
    flushPreview(currentCode);
    previewKey += 1;
  }

  function downloadCode() {
    if (!canExport) return;
    downloadHtml(currentCode, session.title || 'generated-website');
  }

  function openTab() {
    if (!currentCode) return;
    if (!openInNewTab(currentCode, session.title)) toast.error('The browser blocked the new tab.');
  }

  function handleSend(text: string) {
    if (!text.trim()) return;
    if (isEditable && hasChanges) saveChanges();
    isEditable = false;
    if (picking) togglePick();
    onSend(text, target);
    target = null;
    newPrompt = '';
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && picking) {
      togglePick();
      return;
    }
    if (event.key === 'Escape' && isGenerating && !event.defaultPrevented) {
      onStop();
      return;
    }
    if (!hasMod(event)) return;
    const key = event.key.toLowerCase();
    if (key === 's' && isEditable) {
      event.preventDefault();
      saveChanges();
    } else if (key === 'e' && canExport) {
      event.preventDefault();
      downloadCode();
    }
  }

  let comparing = $state(false);
  let diffing = $state(false);

  // ---- Element picker ----
  let frames: (HTMLIFrameElement | undefined)[] = [];
  let picking = $state(false);
  let target = $state<PickedElement | null>(null);
  const canPick = $derived(!isGenerating && !viewed && !!originalCode && !comparing);

  function postToFrames(message: unknown) {
    for (const frame of frames) frame?.contentWindow?.postMessage(message, '*');
  }

  function togglePick() {
    if (!picking && !canPick) return;
    picking = !picking;
    postToFrames({ type: 'localsite:pick', on: picking });
    if (picking && !isDesktop) activeTab = 'preview';
  }

  function onMessage(event: MessageEvent) {
    if (!frames.some((f) => f && f.contentWindow === event.source)) return;
    const data = event.data as { type?: string } & Partial<PickedElement>;
    if (data?.type === 'localsite:picked' && typeof data.selector === 'string') {
      target = {
        selector: data.selector.slice(0, 300),
        label: String(data.label ?? '').slice(0, 80),
        html: String(data.html ?? '').slice(0, 4000)
      };
      picking = false;
      postToFrames({ type: 'localsite:pick', on: false });
    } else if (data?.type === 'localsite:pick-cancel') {
      picking = false;
    }
  }

  // A reloaded preview forgets the pick mode; leave it when the page changes
  $effect(() => {
    void previewContent;
    untrack(() => {
      if (picking) picking = false;
    });
  });

  // ---- Compare & diff ----
  let compareLeftN = $state<number | null>(null);
  const focusVersion = $derived(viewed ?? session.latest);
  const previousOf = (n: number) => [...session.versions].reverse().find((v) => v.n < n);
  const compareRight = $derived(focusVersion);
  const compareLeft = $derived(
    session.byN(compareLeftN) && compareLeftN !== compareRight?.n
      ? session.byN(compareLeftN)
      : compareRight
        ? (previousOf(compareRight.n) ?? session.versions.find((v) => v.n !== compareRight.n))
        : undefined
  );
  const canCompare = $derived(session.versions.length > 1 && !isGenerating);
  const diffBase = $derived(focusVersion ? previousOf(focusVersion.n) : undefined);

  $effect(() => {
    if (isGenerating || session.versions.length < 2) {
      untrack(() => {
        comparing = false;
        diffing = false;
      });
    }
  });

  $effect(() => {
    if (isEditable) untrack(() => (diffing = false));
  });

  const codePanelProps = $derived({
    code: currentCode,
    status: gen.status,
    isGenerating,
    canEdit: generationComplete && !isGenerating,
    isEditable,
    hasChanges,
    copySuccess,
    mod,
    versionLabel: isGenerating ? `writing v${session.nextN}` : viewed ? `viewing v${viewed.n} · read-only` : '',
    toolbarExtra: codeToolbarExtras,
    override: diffing && diffBase && focusVersion ? codeDiff : undefined,
    setEditable,
    onEditedCodeChange: (value: string) => {
      editedCode = value;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => flushPreview(value), 500);
    },
    onSave: saveChanges,
    onDiscard: discardChanges,
    onCopy: copyToClipboard
  });
</script>

<svelte:window onkeydown={onKeydown} onmessage={onMessage} />

{#snippet codeToolbarExtras()}
  {#if viewed && viewed.n !== session.latest?.n && !isGenerating}
    <button type="button" class="chip h-7 px-2.5 text-[12px]" onclick={() => onRestoreVersion(viewed.n)}>
      <History class="h-3.5 w-3.5" /> Restore as v{session.nextN}
    </button>
  {/if}
  {#if diffBase && !isGenerating && !isEditable}
    <button
      type="button"
      class={cn('chip h-7 px-2.5 text-[12px]', diffing && 'border-moon/30 bg-moon/[0.12] text-moon-bright')}
      aria-pressed={diffing}
      onclick={() => (diffing = !diffing)}
      title="Show changes since v{diffBase.n}"
    >
      <GitCompareArrows class="h-3.5 w-3.5" /> Diff vs v{diffBase.n}
    </button>
  {/if}
{/snippet}

{#snippet codeDiff()}
  {#if diffBase && focusVersion}
    <DiffEditor original={diffBase.code} modified={focusVersion.code} />
  {/if}
{/snippet}

{#snippet previewCompare()}
  {#if compareLeft && compareRight}
    <CompareView
      versions={session.versions}
      left={compareLeft}
      right={compareRight}
      onPickLeft={(n) => (compareLeftN = n)}
    />
  {/if}
{/snippet}

{#snippet previewToolbarExtras()}
  {#if canCompare}
    <button
      type="button"
      aria-pressed={comparing}
      onclick={() => (comparing = !comparing)}
      title="Compare versions side by side"
      class={cn(
        'flex h-7 items-center gap-1.5 rounded-[7px] px-2 text-[12px] transition-colors',
        comparing ? 'bg-moon/[0.12] text-moon-bright' : 'text-star-dim hover:bg-moon/[0.07] hover:text-star'
      )}
    >
      <ArrowRightLeft class="h-3.5 w-3.5" /> <span class="hidden xl:inline">Compare</span>
    </button>
  {/if}
{/snippet}

{#snippet composerTools()}
  <button
    type="button"
    onclick={togglePick}
    disabled={!canPick && !picking}
    aria-pressed={picking}
    aria-label="Pick an element in the preview"
    title={picking ? 'Click an element in the preview (esc to cancel)' : 'Pick an element in the preview'}
    class={cn(
      'flex h-8 items-center gap-1.5 rounded-[8px] px-2 text-[12px] transition-colors disabled:opacity-40',
      picking ? 'bg-moon/[0.14] text-moon-bright' : 'text-star-dim hover:bg-moon/[0.07] hover:text-star'
    )}
  >
    <Crosshair class="h-4 w-4" />
    {#if picking}<span>Click an element…</span>{/if}
  </button>
{/snippet}

{#snippet composerAbove()}
  {#if queued}
    <div class="flex items-center gap-2 rounded-[10px] border border-gold/20 bg-gold/[0.05] py-1.5 pl-2.5 pr-1.5 text-[12px]">
      <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-gold"></span>
      <span class="min-w-0 flex-1 truncate text-star-2" title={queued.text}>
        {isGenerating ? `Queued for when v${session.nextN} lands` : 'Queued'} · {queued.text}
      </span>
      {#if !isGenerating}
        <button type="button" class="flex h-6 items-center gap-1 rounded-md px-1.5 text-gold hover:bg-gold/10" onclick={onRunQueued}>
          <Play class="h-3 w-3" /> Run
        </button>
      {/if}
      <button type="button" aria-label="Remove queued change" class="flex h-6 w-6 items-center justify-center rounded-md text-star-dim hover:bg-moon/[0.07] hover:text-star" onclick={onCancelQueue}>
        <X class="h-3.5 w-3.5" />
      </button>
    </div>
  {/if}
  {#if target}
    <div class="flex items-center gap-2 self-start rounded-[8px] border border-moon/15 bg-moon/[0.06] py-1 pl-2 pr-1 font-mono text-[11px] text-moon-bright">
      <Crosshair class="h-3 w-3" />
      <span class="max-w-[220px] truncate" title={target.selector}>&lt;{target.label}&gt;</span>
      <button type="button" aria-label="Clear element" class="flex h-5 w-5 items-center justify-center rounded text-star-dim hover:text-star" onclick={() => (target = null)}>
        <X class="h-3 w-3" />
      </button>
    </div>
  {/if}
{/snippet}

{#snippet statusCapsule(compact: boolean)}
  <StatusCapsule
    status={gen.status}
    isThinking={gen.isThinking}
    startedAt={gen.startedAt}
    endedAt={gen.endedAt}
    code={generatedCode}
    nextN={session.nextN}
    version={viewed ?? (gen.status === 'done' || gen.status === 'idle' ? session.latest : undefined)}
    {compact}
  />
{/snippet}

{#snippet thread(className: string)}
  <ThreadPanel
    {session}
    status={gen.status}
    generating={isGenerating}
    isThinking={gen.isThinking}
    thinkingOutput={gen.thinkingOutput}
    thinkingStartedAt={gen.thinkingStartedAt}
    thinkingEndedAt={gen.thinkingEndedAt}
    code={generatedCode}
    bind:composerValue={newPrompt}
    composerPlaceholder={isGenerating
      ? 'Queue the next change — it runs when this one lands'
      : target
        ? `What should change about <${target.label}>?`
        : 'Describe a change…'}
    composerHint={isDesktop ? '' : model}
    {canQueue}
    {composerTools}
    {composerAbove}
    onSend={handleSend}
    {onStop}
    {onRetry}
    onViewVersion={(n) => onViewVersion(n === session.latest?.n ? null : n)}
    class={className}
  />
{/snippet}

{#snippet preview(className: string)}
  <PreviewPanel
    {generationComplete}
    {viewportSize}
    {originalCode}
    {editedCode}
    {isGenerating}
    {previewKey}
    {previewContent}
    {refreshPreview}
    setViewportSize={(size) => (viewportSize = size)}
    label={previewLabel}
    writingLine={lines}
    onOpenTab={openTab}
    override={comparing && compareLeft && compareRight ? previewCompare : undefined}
    toolbarExtra={previewToolbarExtras}
    onFrames={(f) => (frames = f)}
    class={className}
  />
{/snippet}

<div class="relative flex h-dvh flex-col overflow-hidden bg-night-950 text-star">
  <NightSky variant="quiet" seed={5} />

  {#if isDesktop}
    <div class="relative flex h-full flex-col gap-2.5 p-2.5">
      <WorkspaceHeader
        title={session.title}
        versions={session.versions}
        viewing={session.viewing}
        {pendingN}
        generating={isGenerating}
        {providerName}
        {model}
        {canExport}
        {mod}
        onView={onViewVersion}
        {onStop}
        {onRestart}
        onDownload={downloadCode}
        onCopy={copyToClipboard}
        onOpenTab={openTab}
      >
        {#snippet status()}{@render statusCapsule(false)}{/snippet}
      </WorkspaceHeader>

      <PaneGroup direction="horizontal" autoSaveId="localsite.workspace" class="min-h-0 flex-1">
        <Pane defaultSize={24} minSize={18} maxSize={40}>
          {@render thread('h-full')}
        </Pane>
        <PaneResizer class="group relative flex w-2.5 items-center justify-center">
          <div class="h-10 w-[3px] rounded-full bg-moon/10 transition-colors group-hover:bg-moon/30 group-data-[active]:bg-moon/50"></div>
        </PaneResizer>
        <Pane defaultSize={38} minSize={20}>
          <CodePanel {...codePanelProps} class="h-full" />
        </Pane>
        <PaneResizer class="group relative flex w-2.5 items-center justify-center">
          <div class="h-10 w-[3px] rounded-full bg-moon/10 transition-colors group-hover:bg-moon/30 group-data-[active]:bg-moon/50"></div>
        </PaneResizer>
        <Pane defaultSize={38} minSize={22}>
          {@render preview('h-full')}
        </Pane>
      </PaneGroup>
    </div>
  {:else}
    <div class="relative flex h-full flex-col">
      <header class="flex items-center justify-between gap-2 px-2 pb-1 pt-2">
        <div class="flex min-w-0 items-center">
          <button
            type="button"
            onclick={onRestart}
            disabled={isGenerating}
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-60"
            aria-label="New generation"
          >
            <MoonLogo size={22} />
          </button>
          <h1 class="truncate text-[14px] font-medium text-moon-bright">{session.title || 'Untitled'}</h1>
        </div>
        {@render statusCapsule(true)}
      </header>

      <div class="px-4 pb-3 pt-1">
        <div class="flex rounded-xl border border-moon/[0.08] bg-night-950/60 p-[3px]" role="tablist" aria-label="Workspace">
          {#each [['preview', 'Preview'], ['code', 'Code'], ['thread', 'Thread']] as [id, label] (id)}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onclick={() => (activeTab = id as typeof activeTab)}
              class={cn(
                'h-[38px] flex-1 rounded-[9px] text-[13px] transition-colors',
                activeTab === id ? 'bg-moon/10 text-moon-bright' : 'text-star-muted'
              )}
            >
              {label}
            </button>
          {/each}
        </div>
      </div>

      <div class="min-h-0 flex-1 px-3 pb-3">
        {#if activeTab === 'thread'}
          {@render thread('h-full')}
        {:else if activeTab === 'code'}
          <CodePanel {...codePanelProps} class="h-full" />
        {:else}
          {@render preview('h-full')}
        {/if}
      </div>

      {#if activeTab !== 'thread'}
        <div class="glass rounded-t-3xl px-3.5 pb-[max(env(safe-area-inset-bottom),14px)] pt-2.5">
          <span class="mx-auto mb-2.5 block h-1 w-9 rounded-full bg-moon/20"></span>
          {#if queued || target}
            <div class="mb-2.5 flex flex-col gap-2">{@render composerAbove()}</div>
          {/if}
          {#if gen.isThinking}
            <p class="mb-2.5 truncate font-mono text-[11.5px] text-thought">
              ✦ {gen.thinkingOutput.trim().split('\n').at(-1)}
            </p>
          {/if}
          <form
            class="flex items-center gap-2 rounded-[14px] border border-moon/10 bg-night-950/60 py-1.5 pl-3.5 pr-1.5"
            onsubmit={(e) => {
              e.preventDefault();
              handleSend(newPrompt);
            }}
          >
            <label for="mobile-composer" class="sr-only">Describe the next change</label>
            <input
              id="mobile-composer"
              bind:value={newPrompt}
              placeholder={isGenerating && !canQueue ? `Writing v${session.nextN}…` : 'Describe a change…'}
              class="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-moon-bright placeholder:text-star-dim focus:outline-none"
            />
            {#if isGenerating}
              <button type="button" onclick={onStop} class="h-10 rounded-[11px] bg-moon-bright px-3 text-[13px] font-medium text-night-900">
                Stop
              </button>
            {/if}
            {#if !isGenerating || canQueue}
              <button
                type="submit"
                disabled={!newPrompt.trim()}
                class="h-10 rounded-[11px] bg-moon-bright px-3 text-[13px] font-medium text-night-900 disabled:bg-moon/[0.08] disabled:text-star-dim"
              >
                {isGenerating ? 'Queue' : 'Send'}
              </button>
            {/if}
          </form>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Save Dialog -->
  <Dialog bind:open={showSaveDialog} labelledby="save-dialog-title">
    <h2 id="save-dialog-title" class="font-serif text-[28px] italic leading-none text-moon-bright">Keep your edits?</h2>
    <p class="mt-3 text-[13.5px] text-star-muted">
      Saving creates a new version you can always go back from.
    </p>
    <div class="mt-6 flex justify-end gap-2">
      <Button
        variant="ghost"
        onclick={() => {
          editedCode = originalCode;
          flushPreview(originalCode);
          isEditable = false;
          showSaveDialog = false;
        }}
      >
        Discard
      </Button>
      <Button
        onclick={() => {
          saveChanges();
          isEditable = false;
          showSaveDialog = false;
        }}
      >
        Save as v{session.nextN}
      </Button>
    </div>
  </Dialog>
</div>
