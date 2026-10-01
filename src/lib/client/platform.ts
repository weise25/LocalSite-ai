export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

/** Label for the primary modifier key: ⌘ on Apple devices, Ctrl elsewhere */
export function modKey(): string {
  return isMac() ? "⌘" : "Ctrl ";
}

/** True for ⌘ on macOS and Ctrl elsewhere */
export function hasMod(event: KeyboardEvent): boolean {
  return isMac() ? event.metaKey : event.ctrlKey;
}
