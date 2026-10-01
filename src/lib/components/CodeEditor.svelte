<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type * as Monaco from 'monaco-editor';
  import { editorTheme } from '$lib/client/monaco-theme';
  import { themeStore } from '$lib/state/theme.svelte';
  import { EDITOR_FONT, loadMonaco } from '$lib/client/monaco';

  interface Props {
    code: string;
    isEditable?: boolean;
    /** Highlights the line currently being written */
    streaming?: boolean;
    onChange?: (value: string) => void;
    onSave?: () => void;
  }

  let { code, isEditable = false, streaming = false, onChange, onSave }: Props = $props();

  let container = $state<HTMLDivElement>();
  let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  let monaco: typeof Monaco | null = null;
  let writingLine: Monaco.editor.IEditorDecorationsCollection | null = null;
  let isInitialMount = true;
  let isUserEditing = false;
  let userScrolledAway = false;
  let suppressChange = false;

  onMount(() => {
    let disposed = false;

    (async () => {
      const monacoMod = await loadMonaco();
      if (disposed || !container) return;
      monaco = monacoMod;

      editor = monaco.editor.create(container, {
        value: code,
        language: 'html',
        theme: editorTheme(themeStore.theme),
        readOnly: !isEditable,
        minimap: { enabled: true, renderCharacters: false, scale: 1, maxColumn: 80 },
        scrollBeyondLastLine: false,
        ...EDITOR_FONT,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'line',
        guides: { indentation: true },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, useShadows: false },
        wordWrap: 'on',
        automaticLayout: true
      });

      writingLine = editor.createDecorationsCollection();

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onSave?.());

      // Scroll to the end on initial load
      const model = editor.getModel();
      if (isInitialMount && model) {
        editor.revealLine(model.getLineCount());
        isInitialMount = false;
      }

      editor.onDidChangeCursorPosition(() => {
        if (isEditable) isUserEditing = true;
      });

      editor.onDidScrollChange(() => {
        const model = editor?.getModel();
        if (!model) return;
        const visibleRanges = editor?.getVisibleRanges();
        if (!visibleRanges || visibleRanges.length === 0) return;
        const lastVisibleLine = visibleRanges[visibleRanges.length - 1].endLineNumber;
        userScrolledAway = lastVisibleLine < model.getLineCount() - 5;
      });

      editor.onDidChangeModelContent(() => {
        if (suppressChange) return;
        const value = editor?.getValue();
        if (onChange && value !== undefined) onChange(value);
      });

      syncEditorContent(code);
    })();

    return () => {
      disposed = true;
    };
  });

  onDestroy(() => {
    editor?.dispose();
  });

  function markWritingLine() {
    if (!editor || !writingLine || !monaco) return;
    const model = editor.getModel();
    if (!streaming || !model) {
      writingLine.clear();
      return;
    }
    const line = model.getLineCount();
    writingLine.set([
      {
        range: new monaco.Range(line, 1, line, 1),
        options: { isWholeLine: true, className: 'nocturne-writing-line' }
      }
    ]);
  }

  function syncEditorContent(next: string) {
    if (!editor) return;
    if (editor.getValue() === next) {
      markWritingLine();
      return;
    }

    suppressChange = true;
    editor.setValue(next);
    suppressChange = false;

    const model = editor.getModel();
    if (!isUserEditing && !isEditable && !userScrolledAway && model) {
      editor.revealLine(model.getLineCount());
    }
    markWritingLine();
  }

  // Sync external `code` changes into the editor without firing onChange
  $effect(() => {
    void streaming;
    syncEditorContent(code);
  });

  // Reflect readOnly + reset editing flag when edit mode changes
  $effect(() => {
    editor?.updateOptions({ readOnly: !isEditable });
    if (!isEditable) {
      isUserEditing = false;
      userScrolledAway = false;
    }
  });

  // Follow Daylight / Nocturne
  $effect(() => {
    const name = editorTheme(themeStore.theme);
    void loadMonaco().then((m) => m.editor.setTheme(name));
  });
</script>

<div class="h-full w-full overflow-hidden" bind:this={container}></div>
