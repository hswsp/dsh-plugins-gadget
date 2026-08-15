// Host half of the dsh-model-sync plugin.
// Publishes the "modelSync" Cordis service (a Typert Remote) whose sync()
// method is callable from the browser settings page over the /api RPC
// carrier. Strict-mode dispatch is driven by typert.host.js, so no
// @Remote decorator is required here.
//
// What sync() does, in one click:
//   opencode-go  — replace llm-pi-ai.providers["opencode-go"].models with the
//                  live list from GET {goUrl} (the Go plan catalog, ~26 ids).
//   zen          — replace llm-pi-ai.providers.zen.models with the models the
//                  user has ENABLED on https://opencode.ai, i.e.
//                  GET {zenUrl} with the workspace API key; the endpoint
//                  already filters out workspace-disabled models.
// Capacities (contextWindow / maxTokens / input) are overwritten from the
// official catalog that opencode itself uses (~/.cache/opencode/models.json,
// models.dev-backed). Models missing from that catalog keep their existing
// configured values (or the defaults below).
import z from "@deepseek-ai/schemastery";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

const DEFAULT_GO_URL = "https://opencode.ai/zen/go/v1/models";
const DEFAULT_ZEN_URL = "https://opencode.ai/zen/v1/models";
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_CACHE_PATH = join(homedir(), ".cache", "opencode", "models.json");
const DEFAULT_CONTEXT_WINDOW = 262144;
const DEFAULT_MAX_TOKENS = 32768;

export const Config = z.object({
  goUrl: z.string().default(DEFAULT_GO_URL),
  zenUrl: z.string().default(DEFAULT_ZEN_URL),
  cachePath: z.string().default(DEFAULT_CACHE_PATH),
  timeoutMs: z.number().default(DEFAULT_TIMEOUT_MS),
});

/**
 * Resolve the OpenCode workspace API key, most-trusted first:
 *   1. DSH credentials / env references OPENCODE_WORKSPACE_API_KEY,
 *      OPENCODE_GO_API_KEY, ZEN_API_KEY (all are workspace-scoped keys in
 *      practice; the endpoint only filters by a KeyTable row)
 *   2. OpenCode's own auth.json: opencode-go (fallback opencode) type=api key
 * Without a workspace key the zen endpoint returns EVERY model, which would
 * wipe the user's enabled selection, so the zen sync refuses to run without
 * one.
 */
async function resolveApiKey(ctx) {
  for (const name of ["OPENCODE_WORKSPACE_API_KEY", "OPENCODE_GO_API_KEY", "ZEN_API_KEY"]) {
    try {
      const cred = await ctx.credentials.resolve(credentialRef(name));
      if (cred && cred.value) return cred.value;
    } catch {
      /* fall through */
    }
  }
  try {
    const authPath = join(homedir(), ".local", "share", "opencode", "auth.json");
    const raw = JSON.parse(await readFile(authPath, "utf8"));
    const entry = raw["opencode-go"] ?? raw["opencode"];
    if (entry && entry.type === "api" && typeof entry.key === "string" && entry.key.length > 0) {
      return entry.key;
    }
  } catch {
    /* fall through */
  }
  return undefined;
}

/** GET a models list endpoint; returns { error, ids } with ids null on failure. */
async function fetchModels(url, timeoutMs, apiKey) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { Accept: "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) return { error: `http-${res.status}`, ids: null };
    const body = await res.json();
    const data = body && Array.isArray(body.data) ? body.data : null;
    if (!data) return { error: "bad-json", ids: null };
    return {
      error: null,
      ids: data
        .map((m) => (typeof m === "string" ? m : m && typeof m.id === "string" ? m.id : null))
        .filter(Boolean),
    };
  } catch (e) {
    return { error: e && e.name === "AbortError" ? "timeout" : "network", ids: null };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Load the opencode model catalog (models.dev snapshot) and extract the
 * metadata we care about for the two routes we sync. Returns two Maps:
 * model id -> { name, contextWindow, maxTokens, image }.
 */
async function loadCatalog(cachePath) {
  try {
    const raw = JSON.parse(await readFile(cachePath, "utf8"));
    const pick = (providerId) => {
      const provider = raw && raw[providerId];
      const models = provider && typeof provider.models === "object" ? provider.models : {};
      const out = new Map();
      for (const [id, m] of Object.entries(models)) {
        if (!m || typeof m !== "object") continue;
        const limit = m.limit && typeof m.limit === "object" ? m.limit : {};
        const modalities = m.modalities && typeof m.modalities === "object" ? m.modalities : {};
        const input = Array.isArray(modalities.input) ? modalities.input : [];
        out.set(id, {
          name: typeof m.name === "string" && m.name.length > 0 ? m.name : undefined,
          contextWindow: typeof limit.context === "number" && limit.context > 0 ? limit.context : undefined,
          maxTokens: typeof limit.output === "number" && limit.output > 0 ? limit.output : undefined,
          image: input.includes("image"),
        });
      }
      return out;
    };
    return { go: pick("opencode-go"), zen: pick("opencode") };
  } catch {
    return { go: new Map(), zen: new Map() };
  }
}

/** Build the next models array for one route from its live id list. */
function buildModels(ids, catalog, existing, defaults) {
  const byId = new Map((existing || []).map((m) => [m.id, m]));
  const fallback = new Set();
  const models = ids.map((id) => {
    const meta = catalog.get(id);
    const prev = byId.get(id);
    let contextWindow = meta && meta.contextWindow;
    let maxTokens = meta && meta.maxTokens;
    if (contextWindow === undefined) {
      contextWindow = prev && typeof prev.contextWindow === "number" ? prev.contextWindow : defaults.contextWindow;
      fallback.add(id);
    }
    if (maxTokens === undefined) {
      maxTokens = prev && typeof prev.maxTokens === "number" ? prev.maxTokens : defaults.maxTokens;
      fallback.add(id);
    }
    const name = prev && typeof prev.name === "string" && prev.name.length > 0 ? prev.name : meta && meta.name ? meta.name : id;
    const input = ["text", ...(meta && meta.image ? ["image"] : [])];
    return { id, name, contextWindow, maxTokens, input };
  });
  return {
    models,
    added: ids.filter((id) => !byId.has(id)),
    removed: (existing || []).map((m) => m.id).filter((id) => !ids.includes(id)),
    fallback: [...fallback],
  };
}

function equalModels(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (!x || !y || x.id !== y.id || x.name !== y.name || x.contextWindow !== y.contextWindow || x.maxTokens !== y.maxTokens) {
      return false;
    }
    if (JSON.stringify(x.input) !== JSON.stringify(y.input)) return false;
  }
  return true;
}

export class ModelSyncGateway extends TypertRemoteService {
  static inject = ["credentials", "settings"];
  static Config = Config;

  constructor(ctx, config) {
    super(ctx, "modelSync");
    this.config = config ?? {};
  }

  /** Read the current llm-pi-ai section (undefined when the namespace is unavailable). */
  readPi() {
    try {
      return this.ctx.settings.get(settingsNamespace("llm-pi-ai"));
    } catch {
      return undefined;
    }
  }

  /** Sync one route and return { result, patch } without writing anything. */
  async collect(routeId, pi) {
    const providers = pi && pi.providers && typeof pi.providers === "object" ? pi.providers : {};
    const provider = providers[routeId];
    const empty = { total: 0, added: [], removed: [], fallback: [] };
    // Precondition: the route must already exist in Settings -> Models (its
    // api/baseURL/apiKeyEnv live on the provider, and creating a provider
    // with only models would fail validation).
    if (!provider) return { result: { status: "skipped", error: "not-configured", ...empty }, patch: null };
    const isGo = routeId === "opencode-go";
    const apiKey = isGo ? undefined : await resolveApiKey(this.ctx);
    if (!isGo && !apiKey) return { result: { status: "error", error: "no-api-key", ...empty }, patch: null };
    const catalog = await loadCatalog(this.config.cachePath || DEFAULT_CACHE_PATH);
    const res = await fetchModels(
      isGo ? this.config.goUrl || DEFAULT_GO_URL : this.config.zenUrl || DEFAULT_ZEN_URL,
      this.config.timeoutMs || DEFAULT_TIMEOUT_MS,
      apiKey
    );
    if (!res.ids) return { result: { status: "error", error: res.error, ...empty }, patch: null };
    const defaults = { contextWindow: DEFAULT_CONTEXT_WINDOW, maxTokens: DEFAULT_MAX_TOKENS };
    const built = buildModels(res.ids, isGo ? catalog.go : catalog.zen, provider.models, defaults);
    return {
      result: { status: "ok", error: null, total: built.models.length, added: built.added, removed: built.removed, fallback: built.fallback },
      patch: equalModels(built.models, provider.models) ? null : { models: built.models },
    };
  }

  /** Write the collected patches and assemble the common result envelope. */
  async commit(entries) {
    const patch = {};
    for (const [routeId, entry] of Object.entries(entries)) if (entry && entry.patch) patch[routeId] = entry.patch;
    let warning = null;
    if (Object.keys(patch).length > 0) {
      try {
        await this.ctx.settings.update(settingsNamespace("llm-pi-ai"), { providers: patch });
      } catch (e) {
        return {
          ok: false,
          error: "write-failed",
          warning: String((e && e.message) || e),
          go: (entries["opencode-go"] && entries["opencode-go"].result) || null,
          zen: (entries.zen && entries.zen.result) || null,
        };
      }
    }
    return {
      ok: true,
      error: null,
      warning,
      go: (entries["opencode-go"] && entries["opencode-go"].result) || null,
      zen: (entries.zen && entries.zen.result) || null,
    };
  }

  /** Sync both routes (one settings write). */
  async sync() {
    const pi = this.readPi();
    const go = await this.collect("opencode-go", pi);
    const zen = await this.collect("zen", pi);
    return this.commit({ "opencode-go": go, zen });
  }

  /** Sync only the opencode-go route. */
  async syncGo() {
    const pi = this.readPi();
    const go = await this.collect("opencode-go", pi);
    return this.commit({ "opencode-go": go });
  }

  /** Sync only the zen route. */
  async syncZen() {
    const pi = this.readPi();
    const zen = await this.collect("zen", pi);
    return this.commit({ zen });
  }
}

export default ModelSyncGateway;
