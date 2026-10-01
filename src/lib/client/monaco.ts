import type * as Monaco from "monaco-editor";
import { defineNocturneTheme } from "./monaco-theme";

let loading: Promise<typeof Monaco> | null = null;

/**
 * Loads Monaco once, registers its web workers for Vite (ESM) and the
 * Nocturne theme. Shared by the code editor and the diff view.
 */
export function loadMonaco(): Promise<typeof Monaco> {
  loading ??= (async () => {
    const [monaco, EditorWorker, HtmlWorker, CssWorker] = await Promise.all([
      import("monaco-editor"),
      import("monaco-editor/esm/vs/editor/editor.worker?worker"),
      import("monaco-editor/esm/vs/language/html/html.worker?worker"),
      import("monaco-editor/esm/vs/language/css/css.worker?worker"),
    ]);

    // The HTML/CSS language services need their own workers; without them
    // Monaco falls back to the main thread and throws on foreign modules.
    self.MonacoEnvironment = {
      getWorker: (_id: string, label: string) => {
        if (label === "html" || label === "handlebars" || label === "razor") {
          return new HtmlWorker.default();
        }
        if (label === "css" || label === "scss" || label === "less") {
          return new CssWorker.default();
        }
        return new EditorWorker.default();
      },
    };

    defineNocturneTheme(monaco);
    return monaco;
  })();
  return loading;
}

export const EDITOR_FONT = {
  fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, monospace",
  fontSize: 12.5,
  lineHeight: 22,
};
