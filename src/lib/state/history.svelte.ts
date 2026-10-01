import { readJSON, writeJSON } from "$lib/client/storage";
import type { SessionSnapshot, Version } from "./session.svelte";

const HISTORY_KEY = "localsite.history";
const MAX_SESSIONS = 24;
const MAX_VERSIONS_PER_SESSION = 12;

/**
 * Past sessions with all their versions, kept in localStorage so the
 * sidebar can bring them back. Oldest sessions are dropped when the
 * browser's storage quota is reached.
 */
class HistoryStore {
  sessions = $state<SessionSnapshot[]>([]);
  private loaded = false;

  load() {
    if (this.loaded) return;
    this.loaded = true;
    const stored = readJSON<SessionSnapshot[]>(HISTORY_KEY, []);
    this.sessions = Array.isArray(stored)
      ? stored.filter((s) => s && typeof s.id === "string" && Array.isArray(s.versions))
      : [];
  }

  get(id: string): SessionSnapshot | undefined {
    return this.sessions.find((s) => s.id === id);
  }

  save(snapshot: SessionSnapshot) {
    this.load();
    if (!snapshot.versions.length) return;
    const trimmed: SessionSnapshot = {
      ...snapshot,
      versions: snapshot.versions.slice(-MAX_VERSIONS_PER_SESSION),
    };
    this.sessions = [trimmed, ...this.sessions.filter((s) => s.id !== snapshot.id)]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_SESSIONS);
    this.persist();
  }

  remove(id: string) {
    this.sessions = this.sessions.filter((s) => s.id !== id);
    this.persist();
  }

  private persist() {
    let list = $state.snapshot(this.sessions) as SessionSnapshot[];
    while (!writeJSON(HISTORY_KEY, list) && list.length > 1) {
      list = list.slice(0, -1);
    }
    if (list.length !== this.sessions.length) this.sessions = list;
  }
}

export const historyStore = new HistoryStore();

/** Two colours from the page's CSS, used as a tiny thumbnail in the sidebar. */
export function thumbnailColors(version: Version | undefined): [string, string] {
  const fallback: [string, string] = ["#161D33", "#C7D2FE"];
  if (!version) return fallback;
  const style = version.code.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] ?? version.code;
  const colors = [...style.matchAll(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi)].map((m) => m[0]);
  const unique = [...new Set(colors.map((c) => c.toLowerCase()))];
  return [unique[0] ?? fallback[0], unique.find((c, i) => i > 0) ?? fallback[1]];
}
