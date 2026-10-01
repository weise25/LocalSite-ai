import { readJSON, removeKey, writeJSON } from "$lib/client/storage";

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  isLocal: boolean;
  examples?: string[];
  configured: boolean;
  apiKeyEnvVar: string | null;
  baseUrlEnvVar: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  size?: number;
  parameterSize?: string;
  quantization?: string;
  family?: string;
}

export type ModelStatus = "idle" | "loading" | "ready" | "error";

const MODEL_CACHE_PREFIX = "localsite.models.";

/**
 * Shared provider/model state for the welcome screen, the @-picker and the
 * sidebar. Model lists are cached per tab in sessionStorage.
 */
class ProviderStore {
  providers = $state<ProviderInfo[]>([]);
  providersLoaded = $state(false);
  providersError = $state(false);
  defaultProvider = $state("");

  models = $state<Record<string, ModelInfo[]>>({});
  status = $state<Record<string, ModelStatus>>({});
  errors = $state<Record<string, string>>({});

  private providersPromise: Promise<void> | null = null;
  private inflight = new Map<string, Promise<ModelInfo[]>>();

  byId(id: string): ProviderInfo | undefined {
    return this.providers.find((p) => p.id === id);
  }

  loadProviders(): Promise<void> {
    this.providersPromise ??= (async () => {
      try {
        const [providersRes, defaultRes] = await Promise.all([
          fetch("/api/get-models", { method: "POST" }),
          fetch("/api/get-default-provider").catch(() => null),
        ]);
        if (!providersRes.ok) throw new Error("Error fetching providers");
        const data: ProviderInfo[] = await providersRes.json();
        // Local providers first, then cloud; configured before unconfigured
        this.providers = [...data].sort((a, b) =>
          Number(b.isLocal) - Number(a.isLocal) ||
          Number(b.configured) - Number(a.configured)
        );
        if (defaultRes?.ok) {
          const { defaultProvider } = await defaultRes.json();
          if (typeof defaultProvider === "string") this.defaultProvider = defaultProvider;
        }
      } catch (error) {
        console.error("Error fetching providers:", error);
        this.providersError = true;
        this.providersPromise = null;
      } finally {
        this.providersLoaded = true;
      }
    })();
    return this.providersPromise;
  }

  loadModels(providerId: string, { force = false } = {}): Promise<ModelInfo[]> {
    if (!providerId) return Promise.resolve([]);
    const provider = this.byId(providerId);
    if (provider && !provider.configured) return Promise.resolve([]);

    const cacheKey = MODEL_CACHE_PREFIX + providerId;
    if (!force) {
      if (this.status[providerId] === "ready") {
        return Promise.resolve(this.models[providerId] ?? []);
      }
      const cached = readJSON<ModelInfo[] | null>(cacheKey, null, "session");
      if (Array.isArray(cached)) {
        this.models[providerId] = cached;
        this.status[providerId] = "ready";
        return Promise.resolve(cached);
      }
      const pending = this.inflight.get(providerId);
      if (pending) return pending;
    } else {
      removeKey(cacheKey, "session");
    }

    this.status[providerId] = "loading";
    delete this.errors[providerId];

    const request = (async () => {
      try {
        const response = await fetch(
          `/api/get-models?provider=${encodeURIComponent(providerId)}`,
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Error fetching models");
        const list: ModelInfo[] = Array.isArray(data) ? data : [];
        this.models[providerId] = list;
        this.status[providerId] = "ready";
        writeJSON(cacheKey, list, "session");
        return list;
      } catch (error) {
        this.models[providerId] = [];
        this.status[providerId] = "error";
        this.errors[providerId] = error instanceof Error
          ? error.message
          : "Models could not be loaded.";
        return [];
      } finally {
        this.inflight.delete(providerId);
      }
    })();

    this.inflight.set(providerId, request);
    return request;
  }
}

export const providerStore = new ProviderStore();

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const gb = bytes / 1e9;
  if (gb >= 10) return `${Math.round(gb)} GB`;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${Math.round(bytes / 1e6)} MB`;
}
