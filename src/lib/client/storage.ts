// Thin, failure-tolerant wrappers around Web Storage.
// Storage can be unavailable (private mode, blocked site data) or full;
// callers always get a value back instead of an exception.

type StorageKind = "local" | "session";

function store(kind: StorageKind): Storage | null {
  try {
    return kind === "local" ? globalThis.localStorage : globalThis.sessionStorage;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T, kind: StorageKind = "local"): T {
  try {
    const raw = store(kind)?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Returns false when the value could not be stored (e.g. quota exceeded). */
export function writeJSON(key: string, value: unknown, kind: StorageKind = "local"): boolean {
  try {
    store(kind)?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string, kind: StorageKind = "local"): void {
  try {
    store(kind)?.removeItem(key);
  } catch {
    // ignore
  }
}
