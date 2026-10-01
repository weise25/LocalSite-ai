import type * as Monaco from "monaco-editor";

export const NOCTURNE_THEME = "nocturne";

let defined = false;

/** Registers the Nocturne editor theme once per page. */
export function defineNocturneTheme(monaco: typeof Monaco) {
  if (defined) return;
  defined = true;
  monaco.editor.defineTheme(NOCTURNE_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "E8ECF8" },
      { token: "tag", foreground: "A5B4FC" },
      { token: "metatag", foreground: "A5B4FC" },
      { token: "metatag.content", foreground: "F2D48A" },
      { token: "delimiter", foreground: "7883A4" },
      { token: "delimiter.html", foreground: "7883A4" },
      { token: "attribute.name", foreground: "7DD3C0" },
      { token: "attribute.value", foreground: "F2D48A" },
      { token: "string", foreground: "F2D48A" },
      { token: "number", foreground: "F2D48A" },
      { token: "keyword", foreground: "C7D2FE" },
      { token: "type", foreground: "A5B4FC" },
      { token: "comment", foreground: "5A6380", fontStyle: "italic" },
      { token: "attribute.value.css", foreground: "F2D48A" },
      { token: "attribute.name.css", foreground: "7DD3C0" },
      { token: "identifier", foreground: "E8ECF8" },
    ],
    colors: {
      "editor.background": "#00000000",
      "editor.foreground": "#E8ECF8",
      "editorGutter.background": "#00000000",
      "editor.lineHighlightBackground": "#C7D2FE0A",
      "editor.lineHighlightBorder": "#00000000",
      "editorLineNumber.foreground": "#2E3654",
      "editorLineNumber.activeForeground": "#C7D2FE",
      "editorCursor.foreground": "#EEF1FF",
      "editor.selectionBackground": "#C7D2FE33",
      "editor.inactiveSelectionBackground": "#C7D2FE1A",
      "editorIndentGuide.background1": "#C7D2FE0F",
      "editorIndentGuide.activeBackground1": "#C7D2FE26",
      "editorWhitespace.foreground": "#C7D2FE14",
      "editorBracketMatch.background": "#C7D2FE1A",
      "editorBracketMatch.border": "#C7D2FE40",
      "minimap.background": "#00000000",
      "minimapSlider.background": "#C7D2FE14",
      "minimapSlider.hoverBackground": "#C7D2FE22",
      "scrollbarSlider.background": "#C7D2FE1C",
      "scrollbarSlider.hoverBackground": "#C7D2FE2E",
      "scrollbarSlider.activeBackground": "#C7D2FE3A",
      "editorWidget.background": "#111729",
      "editorWidget.border": "#222B47",
      "editorSuggestWidget.background": "#111729",
      "editorSuggestWidget.selectedBackground": "#1D2540",
      "editorHoverWidget.background": "#111729",
      "diffEditor.insertedTextBackground": "#7DD3C01F",
      "diffEditor.removedTextBackground": "#F29B9B1F",
      "diffEditor.insertedLineBackground": "#7DD3C012",
      "diffEditor.removedLineBackground": "#F29B9B12",
      "diffEditor.diagonalFill": "#C7D2FE10",
      "focusBorder": "#C7D2FE40",
      "scrollbar.shadow": "#00000000",
      "editorOverviewRuler.border": "#00000000",
      "editorOverviewRuler.background": "#00000000",
    },
  });
}

export const DAYLIGHT_THEME = "daylight";

let definedDay = false;

/** Light editor theme for the Daylight UI. */
export function defineDaylightTheme(monaco: typeof Monaco) {
  if (definedDay) return;
  definedDay = true;
  monaco.editor.defineTheme(DAYLIGHT_THEME, {
    base: "vs",
    inherit: true,
    rules: [
      { token: "", foreground: "1C2340" },
      { token: "tag", foreground: "3B4FB8" },
      { token: "metatag", foreground: "3B4FB8" },
      { token: "metatag.content", foreground: "8A5A12" },
      { token: "delimiter", foreground: "7A84A6" },
      { token: "delimiter.html", foreground: "7A84A6" },
      { token: "attribute.name", foreground: "0D7A67" },
      { token: "attribute.value", foreground: "8A5A12" },
      { token: "string", foreground: "8A5A12" },
      { token: "number", foreground: "8A5A12" },
      { token: "keyword", foreground: "3B4FB8" },
      { token: "type", foreground: "3B4FB8" },
      { token: "comment", foreground: "8A93AD", fontStyle: "italic" },
      { token: "attribute.value.css", foreground: "8A5A12" },
      { token: "attribute.name.css", foreground: "0D7A67" },
    ],
    colors: {
      "editor.background": "#00000000",
      "editor.foreground": "#1C2340",
      "editorGutter.background": "#00000000",
      "editor.lineHighlightBackground": "#3B4FB80A",
      "editor.lineHighlightBorder": "#00000000",
      "editorLineNumber.foreground": "#B4BBD1",
      "editorLineNumber.activeForeground": "#3B4FB8",
      "editorCursor.foreground": "#1A2252",
      "editor.selectionBackground": "#3B4FB82E",
      "editor.inactiveSelectionBackground": "#3B4FB818",
      "editorIndentGuide.background1": "#1A225212",
      "editorIndentGuide.activeBackground1": "#1A225228",
      "minimap.background": "#00000000",
      "minimapSlider.background": "#1A225212",
      "scrollbarSlider.background": "#1A22521C",
      "scrollbarSlider.hoverBackground": "#1A22522E",
      "editorWidget.background": "#FFFFFF",
      "editorWidget.border": "#D5DBEA",
      "diffEditor.insertedTextBackground": "#0D8A7426",
      "diffEditor.removedTextBackground": "#C2413A22",
      "diffEditor.insertedLineBackground": "#0D8A7412",
      "diffEditor.removedLineBackground": "#C2413A10",
      "focusBorder": "#3B4FB840",
      "scrollbar.shadow": "#00000000",
      "editorOverviewRuler.border": "#00000000",
      "editorOverviewRuler.background": "#00000000",
    },
  });
}

export function editorTheme(theme: "day" | "night"): string {
  return theme === "day" ? DAYLIGHT_THEME : NOCTURNE_THEME;
}
