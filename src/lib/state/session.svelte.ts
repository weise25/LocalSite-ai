import { lineDiffStats } from "$lib/generation/diff";

export interface Version {
  n: number;
  /** The instruction that produced this version ("" for a manual edit) */
  prompt: string;
  code: string;
  createdAt: number;
  durationMs: number;
  thinking: string;
  thinkingMs: number;
  lines: number;
  added: number;
  removed: number;
  /** Generation was stopped early */
  stopped: boolean;
  /** Saved from the editor instead of generated */
  manual: boolean;
  provider: string;
  model: string;
}

export interface SessionSnapshot {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  versions: Version[];
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function makeTitle(prompt: string): string {
  const firstLine = prompt.trim().split(/\n|(?<=[.!?])\s/)[0] ?? "";
  const cleaned = firstLine
    .replace(/^(please\s+)?(create|build|make|generate|design)\s+(me\s+)?/i, "")
    .replace(/^(an?|the)\s+/i, "")
    .trim();
  const base = cleaned || prompt.trim() || "Untitled";
  const title = base.length > 44 ? `${base.slice(0, 44).replace(/\s+\S*$/, "")}…` : base;
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * One generation session: the prompts the user sent and the versions
 * that came back. Versions are numbered from 1.
 */
export class Session {
  id = $state(newId());
  title = $state("");
  createdAt = $state(0);
  updatedAt = $state(0);
  versions = $state<Version[]>([]);
  /** Prompt of the generation currently running ("" when idle) */
  pendingPrompt = $state("");
  /** Version being looked at; null follows the latest / live output */
  viewing = $state<number | null>(null);

  get latest(): Version | undefined {
    return this.versions[this.versions.length - 1];
  }

  get nextN(): number {
    return (this.latest?.n ?? 0) + 1;
  }

  byN(n: number | null): Version | undefined {
    return n == null ? undefined : this.versions.find((v) => v.n === n);
  }

  start(prompt: string) {
    this.id = newId();
    this.title = makeTitle(prompt);
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
    this.versions = [];
    this.pendingPrompt = prompt;
    this.viewing = null;
  }

  beginTurn(prompt: string) {
    this.pendingPrompt = prompt;
    this.viewing = null;
  }

  endTurn() {
    this.pendingPrompt = "";
  }

  commit(input: {
    prompt: string;
    code: string;
    durationMs?: number;
    thinking?: string;
    thinkingMs?: number;
    stopped?: boolean;
    manual?: boolean;
    provider: string;
    model: string;
  }): Version {
    const previous = this.latest?.code ?? "";
    const { added, removed } = lineDiffStats(previous, input.code);
    const version: Version = {
      n: this.nextN,
      prompt: input.prompt,
      code: input.code,
      createdAt: Date.now(),
      durationMs: input.durationMs ?? 0,
      thinking: input.thinking ?? "",
      thinkingMs: input.thinkingMs ?? 0,
      lines: input.code ? input.code.split("\n").length : 0,
      added,
      removed,
      stopped: input.stopped ?? false,
      manual: input.manual ?? false,
      provider: input.provider,
      model: input.model,
    };
    this.versions.push(version);
    this.updatedAt = version.createdAt;
    this.pendingPrompt = "";
    return version;
  }

  restore(snapshot: SessionSnapshot) {
    this.id = snapshot.id;
    this.title = snapshot.title;
    this.createdAt = snapshot.createdAt;
    this.updatedAt = snapshot.updatedAt;
    this.versions = snapshot.versions;
    this.pendingPrompt = "";
    this.viewing = null;
  }

  snapshot(): SessionSnapshot {
    return {
      id: this.id,
      title: this.title,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      versions: $state.snapshot(this.versions),
    };
  }

  reset() {
    this.id = newId();
    this.title = "";
    this.createdAt = 0;
    this.updatedAt = 0;
    this.versions = [];
    this.pendingPrompt = "";
    this.viewing = null;
  }
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
