// Host half of the dsh-model-sync plugin.
// Publishes the "modelSync" Cordis service (a Typert Remote) whose sync()
// method is callable from the browser settings page over the /api RPC
// carrier. Strict-mode dispatch is driven by typert.host.js, so no
// @Remote decorator is required here.
//
// What sync() does, in one click:
//   opencode-go  — rebuilds the pi-ai catalog file that llm-pi-ai reads for
//                  this route, from the OFFICIAL model data, then keeps the
//                  settings provider lean (no api/baseURL/models fields) so
//                  per-model wire protocols dispatch from the catalog.
//   zen          — replace llm-pi-ai.providers.zen.models with the models the
//                  user has ENABLED on https://opencode.ai, i.e.
//                  GET {zenUrl} with the workspace API key; the endpoint
//                  already filters out workspace-disabled models.
//
// Why rebuild the catalog file instead of writing settings models:
//   dsh-llm-pi-ai's profile schema has no per-model api field — a route-level
//   `api` squashes every model onto one wire protocol. The installed pi-ai
//   catalog (providers/data/opencode-go.json) is the ONLY channel that carries
//   per-model api/baseUrl. OpenCode Go mixes three protocols on one endpoint
//   (luna/grok→openai-responses, glm/kimi/deepseek→openai-completions,
//   minimax/qwen→anthropic-messages), so the catalog file is what makes every
//   model work. This plugin refreshes that file from the official live data.
//   The catalog is loaded once per dsh process (ESM import), so a rebuild
//   takes effect after a dsh restart.
import z from "@deepseek-ai/schemastery";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { OPENCODE_GO_MODELS } from "@earendil-works/pi-ai/providers/opencode-go.models";
import { OPENCODE_MODELS } from "@earendil-works/pi-ai/providers/opencode.models";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import { statSync } from "node:fs";

const DEFAULT_GO_URL = "https://opencode.ai/zen/go/v1/models";
const DEFAULT_ZEN_URL = "https://opencode.ai/zen/v1/models";
// Current and legacy settings route keys for the OpenCode Zen provider. The
// current DSH config names the route "opencode" (the pi-ai built-in provider
// id, which is what makes reuseCatalogProvider dispatch per-model protocols);
// older configs called it "zen". The sync accepts both so a config written
// under either name keeps working.
const ZEN_ROUTE_KEYS = ["opencode", "zen"];
// Official model metadata (models.dev / provider data), the same source the
// OpenCode docs page and pi-ai's own catalog are generated from.
const DEFAULT_MODELS_API = "https://models.opencode.ai/api.json";
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_CACHE_PATH = join(homedir(), ".cache", "opencode", "models.json");
const DEFAULT_CONTEXT_WINDOW = 262144;
const DEFAULT_MAX_TOKENS = 32768;

// Official per-model wire protocol for OpenCode Go, from
// https://opencode.ai/docs/go#endpoints. This is the authoritative table;
// models.opencode.ai/api.json omits provider.npm for several models whose
// docs list a non-openai endpoint (the qwen messages group), so this map
// overrides where the two sources disagree. Anything not listed here defaults
// to openai-completions (the provider-level @ai-sdk/openai-compatible).
const OFFICIAL_GO_PROTO = {
  // responses (@ai-sdk/openai)
  "grok-4.6": "openai-responses",
  "grok-4.5": "openai-responses",
  "gpt-5.6-luna": "openai-responses",
  "muse-spark-1.2-contributor": "openai-responses",
  // messages (@ai-sdk/anthropic) — includes the qwen models api.json leaves
  // unannotated; anthropic-messages uses the /v1-less baseUrl so the SDK's
  // /v1/messages suffix lands correctly.
  "minimax-m3": "anthropic-messages",
  "minimax-m2.7": "anthropic-messages",
  "minimax-m2.5": "anthropic-messages",
  "qwen3.8-max": "anthropic-messages",
  "qwen3.8-flash": "anthropic-messages",
  "qwen3.7-max": "anthropic-messages",
  "qwen3.7-plus": "anthropic-messages",
  "qwen3.6-plus": "anthropic-messages",
  // everything else defaults to openai-completions
};

// Base URLs per protocol. OpenAI-family clients take baseURL through /v1 and
// append their path (/responses, /chat/completions); the Anthropic client
// appends /v1/messages itself, so its baseUrl must NOT carry /v1.
const PROTO_BASE_URL = {
  "openai-responses": "https://opencode.ai/zen/go/v1",
  "openai-completions": "https://opencode.ai/zen/go/v1",
  "anthropic-messages": "https://opencode.ai/zen/go",
};

export const Config = z.object({
  goUrl: z.string().default(DEFAULT_GO_URL),
  zenUrl: z.string().default(DEFAULT_ZEN_URL),
  modelsApi: z.string().default(DEFAULT_MODELS_API),
  cachePath: z.string().default(DEFAULT_CACHE_PATH),
  timeoutMs: z.number().default(DEFAULT_TIMEOUT_MS),
});

/**
 * Resolve the OpenCode workspace API key, most-trusted first:
 *   0. an explicitly supplied key (the Settings page's API key field)
 *   1. DSH credentials / env references OPENCODE_WORKSPACE_API_KEY,
 *      OPENCODE_GO_API_KEY, ZEN_API_KEY (all are workspace-scoped keys in
 *      practice; the endpoint only filters by a KeyTable row)
 *   2. OpenCode's own auth.json: opencode-go (fallback opencode) type=api key
 * Without a workspace key the zen endpoint returns EVERY model, which would
 * wipe the user's enabled selection, so the zen sync refuses to run without
 * one.
 */
async function resolveApiKey(ctx, explicitKey) {
  if (typeof explicitKey === "string" && explicitKey.length > 0) return explicitKey;
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

/**
 * Fetch the live model list with a key and derive a small account summary:
 * how many models are available on the two tiers. The /models endpoints are
 * the public account surface OpenCode exposes; the summary is what the Sync
 * page shows above the per-provider cards.
 */
async function fetchAccountSummary(zenUrl, goUrl, timeoutMs, apiKey) {
  const zen = await fetchModels(zenUrl, timeoutMs, apiKey);
  const go = await fetchModels(goUrl, timeoutMs, apiKey);
  return {
    zen: zen.ids ? zen.ids.length : null,
    go: go.ids ? go.ids.length : null,
    zenError: zen.error,
    goError: go.error,
  };
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

/**
 * Fetch the official model metadata and build the complete pi-ai catalog
 * object for the opencode-go route: { protocol: { id: modelEntry } }.
 * Protocol comes from OFFICIAL_GO_PROTO (docs' endpoints table); capacities
 * and modalities come from models.opencode.ai/api.json.
 * @returns the catalog groups object, or undefined on failure.
 */
async function buildOfficialGoCatalog(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(DEFAULT_MODELS_API, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (!res.ok) throw new Error(`http-${res.status}`);
    const raw = await res.json();
    const go = raw && raw["opencode-go"];
    const models = go && typeof go.models === "object" ? go.models : {};
    const groups = {};
    const protos = ["anthropic-messages", "openai-completions", "openai-responses"];
    for (const proto of protos) groups[proto] = {};
    let built = 0;
    for (const [mid, m] of Object.entries(models)) {
      if (!m || typeof m !== "object") continue;
      const proto = OFFICIAL_GO_PROTO[mid] ?? "openai-completions";
      const limit = m.limit && typeof m.limit === "object" ? m.limit : {};
      const modalities = m.modalities && typeof m.modalities === "object" ? m.modalities : {};
      const input = Array.isArray(modalities.input) ? modalities.input : ["text"];
      const prev = OPENCODE_GO_MODELS[mid];
      const entry = {
        id: mid,
        name: typeof m.name === "string" && m.name.length > 0 ? m.name : mid,
        api: proto,
        provider: "opencode-go",
        baseUrl: PROTO_BASE_URL[proto],
        reasoning: m.reasoning === true || (prev && prev.reasoning === true),
        input,
        contextWindow: typeof limit.context === "number" && limit.context > 0 ? limit.context : DEFAULT_CONTEXT_WINDOW,
        maxTokens: typeof limit.output === "number" && limit.output > 0 ? limit.output : DEFAULT_MAX_TOKENS,
        cost: prev && prev.cost ? prev.cost : undefined,
      };
      if (entry.cost === undefined) delete entry.cost;
      groups[proto][mid] = entry;
      built += 1;
    }
    return { groups, total: built };
  } catch (e) {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

const CATALOG_REL = join("dist", "providers", "data", "opencode-go.json");

/**
 * The real path of the pi-ai catalog this process actually loads.
 *
 * Resolving beats guessing: the same package is imported at the top of this
 * file, so `import.meta.resolve` yields exactly the copy Node would read. That
 * holds wherever the host keeps its runtime — the dsh CLI's own install, a
 * checkout, or the packaged Electron app, whose modules live inside
 * `/Applications/DSH Desktop.app` and match none of the old layout guesses.
 * The candidate list remains only as a fallback for hosts without the
 * resolve hook.
 *
 * @returns {Promise<string[]>} absolute paths of existing opencode-go.json files.
 */
async function catalogFileCandidates() {
  const dir = dirname(fileURLToPath(import.meta.url));
  const out = [];

  // 1. The catalog belonging to the pi-ai copy this process imports.
  try {
    const entry = import.meta.resolve("@earendil-works/pi-ai/providers/opencode-go.models");
    out.push(join(dirname(fileURLToPath(entry)), "data", "opencode-go.json"));
  } catch {
    /* resolve hook unavailable on this host — fall through to the layout hints */
  }

  // 2. The package root as Node resolves it from this file, which covers
  //    hosts whose export map hides the provider subpath.
  try {
    const pkg = import.meta.resolve("@earendil-works/pi-ai");
    out.push(join(dirname(fileURLToPath(pkg)), CATALOG_REL));
  } catch {
    /* not resolvable from here */
  }

  // 3. Layout hints, for installs where resolution stops short of the data file.
  const home = process.env.DSH_HOME || join(homedir(), ".dsh");
  out.push(
    join(home, "profiles", "node_modules", "@earendil-works", "pi-ai", CATALOG_REL),
    join(home, "..", "node_modules", "@earendil-works", "pi-ai", CATALOG_REL),
  );

  // Keep only paths that actually exist, in first-seen order.
  const seen = new Set();
  const existing = [];
  for (const p of out) {
    const abs = resolve(p);
    if (seen.has(abs)) continue;
    seen.add(abs);
    try {
      if (statSync(abs).isFile()) existing.push(abs);
    } catch {
      /* path absent — skip */
    }
  }
  return existing;
}

/** Write the rebuilt go catalog to every copy of the pi-ai data file. */
async function writeCatalogFiles(groups) {
  const payload = JSON.stringify(groups, null, 1) + "\n";
  const paths = [...new Set(await catalogFileCandidates())];
  const written = [];
  const failed = [];
  for (const p of paths) {
    try {
      await writeFile(p, payload, "utf8");
      written.push(p);
    } catch {
      failed.push(p);
    }
  }
  return { written, failed, bytes: payload.length };
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
      return this.ctx.settings.get("llm-pi-ai");
    } catch {
      return undefined;
    }
  }

  /** Sync one route and return { result, patch } without writing anything. */
  async collect(routeId, pi, explicitKey) {
    const providers = pi && pi.providers && typeof pi.providers === "object" ? pi.providers : {};
    // The zen sync accepts both the current "opencode" route key and the
    // legacy "zen" one; pick whichever exists in the config.
    const isGo = routeId === "opencode-go";
    const zenKey = isGo ? null : ZEN_ROUTE_KEYS.find((k) => providers[k] !== undefined);
    const provider = isGo ? providers[routeId] : (zenKey ? providers[zenKey] : undefined);
    // The settings key this entry writes to: the zen route may live under
    // "opencode" (current) or "zen" (legacy) — whatever the config uses.
    const routeKey = isGo ? routeId : (zenKey || routeId);
    // Catalog availability check: which live ids the installed pi-ai catalog
    // cannot describe (no per-model api), so they must be skipped from the
    // settings write. Reported as `extra` so the user sees which live models
    // are newer than the installed catalog instead of silently dropping them.
    const isInCatalog = isGo
      ? (id) => OPENCODE_GO_MODELS[id] !== undefined
      : (id) => OPENCODE_MODELS[id] !== undefined;
    const empty = { total: 0, added: [], removed: [], fallback: [], extra: [] };
    // Precondition: the route must already exist in Settings -> Models (its
    // apiKeyEnv lives on the provider, and creating a provider from scratch
    // would fail validation).
    if (!provider) {
      return { routeKey, result: { status: "skipped", error: "not-configured", ...empty }, patch: null };
    }
    const apiKey = isGo ? undefined : await resolveApiKey(this.ctx, explicitKey);
    if (!isGo && !apiKey) {
      return { routeKey, result: { status: "error", error: "no-api-key", ...empty }, patch: null };
    }
    const catalog = await loadCatalog(this.config.cachePath || DEFAULT_CACHE_PATH);
    const url = isGo ? this.config.goUrl || DEFAULT_GO_URL : this.config.zenUrl || DEFAULT_ZEN_URL;
    const res = await fetchModels(url, this.config.timeoutMs || DEFAULT_TIMEOUT_MS, apiKey);
    if (!res.ids) {
      return { routeKey, result: { status: "error", error: res.error, ...empty }, patch: null };
    }
    // Every model written into settings must be describable by the installed
    // pi-ai catalog: dsh-llm-pi-ai resolves each configured model's wire api
    // from the catalog (base?.api), and models entries carry no api field, so
    // a live id the catalog does not describe fails the whole settings write
    // ("needs an api"). Filtering also keeps per-model protocol dispatch
    // correct — the opencode-go route filters against OPENCODE_GO_MODELS, and
    // the zen route (route key "opencode") against OPENCODE_MODELS, the same
    // catalog ids the built-in opencode provider serves.
    const ids = res.ids.filter(isInCatalog);
    const extra = res.ids.filter((id) => !isInCatalog(id));
    const defaults = { contextWindow: DEFAULT_CONTEXT_WINDOW, maxTokens: DEFAULT_MAX_TOKENS };
    const built = buildModels(ids, isGo ? catalog.go : catalog.zen, provider.models, defaults);
    // Both routes intentionally carry no api / baseURL fields: omitting them
    // hands model resolution to the installed catalog, where each model's own
    // api/baseUrl is used (mixed protocols on one endpoint). Pinning a
    // route-level api would squash every model onto one wire protocol. The
    // zen route ("opencode") is served by the built-in opencode provider the
    // same way opencode-go is — four protocols dispatch from the catalog.
    const patch = {};
    if (!equalModels(built.models, provider.models)) patch.models = built.models;
    return {
      routeKey,
      result: { status: "ok", error: null, total: built.models.length, added: built.added, removed: built.removed, fallback: built.fallback, extra },
      patch: Object.keys(patch).length > 0 ? patch : null,
    };
  }

  /** Write the collected patches and assemble the common result envelope. */
  async commit(entries) {
    const patch = {};
    for (const entry of Object.values(entries)) if (entry && entry.patch) patch[entry.routeKey] = entry.patch;
    let warning = null;
    if (Object.keys(patch).length > 0) {
      try {
        await this.ctx.settings.update("llm-pi-ai", { providers: patch });
      } catch (e) {
        return {
          ok: false,
          error: "write-failed",
          warning: String((e && e.message) || e),
          go: (entries.go && entries.go.result) || null,
          zen: (entries.zen && entries.zen.result) || null,
        };
      }
    }
    return {
      ok: true,
      error: null,
      warning,
      go: (entries.go && entries.go.result) || null,
      zen: (entries.zen && entries.zen.result) || null,
    };
  }

  /**
   * Rebuild the pi-ai opencode-go catalog file from the official model data
   * (models.opencode.ai/api.json + docs' per-model protocol table). This is
   * how new go models get their wire protocol: the catalog file is the only
   * channel dsh-llm-pi-ai reads per-model api from. Callers see how many
   * models were written and where.
   */
  async syncGoCatalog() {
    const built = await buildOfficialGoCatalog(this.config.timeoutMs || DEFAULT_TIMEOUT_MS);
    if (!built) {
      return { ok: false, error: "fetch-failed", total: 0, written: [], failed: [] };
    }
    const written = await writeCatalogFiles(built.groups);
    return {
      ok: true,
      error: null,
      total: built.total,
      byProtocol: Object.fromEntries(Object.entries(built.groups).map(([p, ms]) => [p, Object.keys(ms).length])),
      written: written.written,
      failed: written.failed,
      bytes: written.bytes,
    };
  }

  /**
   * Persist the OpenCode workspace API key supplied from the Sync page into
   * the DSH credentials store under the ZEN_API_KEY reference, so later syncs
   * (and the provider's own credential resolution) pick it up. Returns true
   * once written.
   */
  async setApiKey(key) {
    if (typeof key !== "string" || key.length === 0) {
      // Match the strict result schema: { ok, error, warning, go, zen }.
      return { ok: false, error: "empty-key", warning: null, go: null, zen: null };
    }
    this.ctx.credentials.set(credentialRef("ZEN_API_KEY"), key);
    return { ok: true, error: null, warning: null, go: null, zen: null };
  }

  /**
   * Fetch the account-level availability summary shown above the provider
   * cards: how many models each tier currently lists (zen filtered by the
   * workspace key, go the full official list). Errors are reported per-tier
   * so a failing endpoint does not hide the other one. The key is resolved
   * from the credentials store (ZEN_API_KEY) or env. The summary rides in
   * the `zen` result slot to satisfy the strict wire schema.
   */
  async fetchAccount() {
    const apiKey = await resolveApiKey(this.ctx, undefined);
    if (!apiKey) {
      return {
        ok: true,
        error: null,
        warning: null,
        go: null,
        zen: { status: "account", error: null, total: 0, added: [], removed: [], fallback: [], extra: [], account: { zen: null, go: null, zenError: "no-api-key", goError: null } },
      };
    }
    const summary = await fetchAccountSummary(
      this.config.zenUrl || DEFAULT_ZEN_URL,
      this.config.goUrl || DEFAULT_GO_URL,
      this.config.timeoutMs || DEFAULT_TIMEOUT_MS,
      apiKey,
    );
    return {
      ok: true,
      error: null,
      warning: null,
      go: null,
      zen: { status: "account", error: null, total: 0, added: [], removed: [], fallback: [], extra: [], account: summary },
    };
  }

  /** Sync both routes (one settings write). */
  async sync() {
    const pi = this.readPi();
    // Refresh rebuilds the go catalog first (the per-model protocol channel)
    // before the settings write, so the whole operation stays coherent.
    const goCatalog = await this.syncGoCatalog();
    const go = await this.collect("opencode-go", pi);
    const zen = await this.collect(ZEN_ROUTE_KEYS[0], pi, undefined);
    const committed = await this.commit({
      go: { routeKey: "opencode-go", result: go.result, patch: go.patch },
      zen: { routeKey: zen.routeKey, result: zen.result, patch: zen.patch },
    });
    return {
      ...committed,
      goCatalog,
    };
  }

  /** Sync only the opencode-go route. */
  async syncGo() {
    const pi = this.readPi();
    const go = await this.collect("opencode-go", pi);
    return this.commit({
      go: { routeKey: "opencode-go", result: go.result, patch: go.patch },
    });
  }

  /** Sync only the zen route (route key opencode or the legacy zen). */
  async syncZen() {
    const pi = this.readPi();
    const zen = await this.collect(ZEN_ROUTE_KEYS[0], pi, undefined);
    return this.commit({
      zen: { routeKey: zen.routeKey, result: zen.result, patch: zen.patch },
    });
  }
}

export default ModelSyncGateway;