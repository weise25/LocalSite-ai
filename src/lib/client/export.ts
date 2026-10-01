export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "generated-website";
}

export function downloadHtml(code: string, name: string) {
  const element = document.createElement("a");
  const file = new Blob([code], { type: "text/html" });
  element.href = URL.createObjectURL(file);
  element.download = `${slugify(name)}.html`;
  document.body.appendChild(element);
  element.click();
  URL.revokeObjectURL(element.href);
  document.body.removeChild(element);
}

/**
 * Opens the page in a new tab inside a sandboxed iframe. The generated code
 * gets an opaque origin there, so it cannot read this app's storage.
 */
export function openInNewTab(code: string, title: string): boolean {
  const win = globalThis.open("", "_blank");
  if (!win) return false;
  const doc = win.document;
  doc.title = title || "Preview";
  doc.body.style.margin = "0";
  const frame = doc.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts allow-forms allow-popups allow-modals");
  frame.setAttribute("title", title || "Preview");
  frame.style.cssText = "border:0;width:100vw;height:100vh;display:block";
  frame.srcdoc = code;
  doc.body.appendChild(frame);
  return true;
}
