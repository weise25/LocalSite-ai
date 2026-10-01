<script lang="ts">
  import { onMount } from 'svelte';
  import type * as Monaco from 'monaco-editor';
  import { NOCTURNE_THEME } from '$lib/client/monaco-theme';
  import { EDITOR_FONT, loadMonaco } from '$lib/client/monaco';

  interface Props {
    original: string;
    modified: string;
  }

  let { original, modified }: Props = $props();

  let container = $state<HTMLDivElement>();
  let editor: Monaco.editor.IStandaloneDiffEditor | null = null;
  let models: Monaco.editor.ITextModel[] = [];

  onMount(() => {
    let disposed = false;

    void loadMonaco().then((monaco) => {
      if (disposed || !container) return;
      editor = monaco.editor.createDiffEditor(container, {
        theme: NOCTURNE_THEME,
        readOnly: true,
        originalEditable: false,
        renderSideBySide: true,
        useInlineViewWhenSpaceIsLimited: true,
        renderSideBySideInlineBreakpoint: 760,
        hideUnchangedRegions: { enabled: true, contextLineCount: 3, minimumLineCount: 6 },
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        renderOverviewRuler: false,
        wordWrap: 'on',
        ...EDITOR_FONT,
        padding: { top: 12, bottom: 12 },
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, useShadows: false },
        automaticLayout: true
      });
      models = [monaco.editor.createModel(original, 'html'), monaco.editor.createModel(modified, 'html')];
      editor.setModel({ original: models[0], modified: models[1] });
    });

    return () => {
      disposed = true;
      editor?.dispose();
      for (const m of models) m.dispose();
    };
  });

  $effect(() => {
    if (models.length !== 2) return;
    if (models[0].getValue() !== original) models[0].setValue(original);
    if (models[1].getValue() !== modified) models[1].setValue(modified);
  });
</script>

<div class="h-full w-full overflow-hidden" bind:this={container}></div>
