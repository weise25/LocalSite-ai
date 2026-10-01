import { readJSON, writeJSON } from "$lib/client/storage";

export type ThemeMode = "auto" | "day" | "night";
export type Theme = "day" | "night";

export const THEME_KEY = "localsite.theme";

/** Daylight runs from 06:00 to 17:59 local time; Nocturne the rest. */
export function themeForTime(time = Date.now()): Theme {
  // Plain one-off read of the clock, not reactive state
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const hour = new Date(time).getHours();
  return hour >= 6 && hour < 18 ? "day" : "night";
}

class ThemeStore {
  mode = $state<ThemeMode>("auto");
  private now = $state(Date.now());
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const stored = readJSON<ThemeMode>(THEME_KEY, "auto");
    this.mode = stored === "day" || stored === "night" ? stored : "auto";
  }

  get theme(): Theme {
    return this.mode === "auto" ? themeForTime(this.now) : this.mode;
  }

  /** Re-checks the clock every minute so "auto" flips at sunrise/sunset. */
  start() {
    if (this.timer) return;
    this.timer = setInterval(() => (this.now = Date.now()), 60_000);
  }

  setMode(mode: ThemeMode) {
    this.mode = mode;
    this.now = Date.now();
    writeJSON(THEME_KEY, mode);
  }

  /** auto → day → night → auto */
  cycle() {
    this.setMode(this.mode === "auto" ? "day" : this.mode === "day" ? "night" : "auto");
  }
}

export const themeStore = new ThemeStore();
