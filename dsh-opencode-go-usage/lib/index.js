import { a as maskedConfigView, c as writeConfigFile, i as loadConfig, o as normalizeCookie, r as configFilePath, s as normalizeToken } from "./config-D5FKQiW_.js";
import { Service } from "@deepseek-ai/cordis";
//#region src/routes.ts
/** Browser-facing base path of the usage API. */
const OCGO_API_PREFIX = "/api/ocgo-usage";
/** Write one JSON response. */
function json(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
/** Require the method or answer 405. */
function requireMethod(req, res, method) {
	if (req.method === method) return true;
	json(res, 405, {
		ok: false,
		error: "method-not-allowed"
	});
	return false;
}
/** Read a bounded JSON request body. */
function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let size = 0;
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > 65536) {
				reject(/* @__PURE__ */ new Error("body-too-large"));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			const raw = Buffer.concat(chunks).toString("utf8");
			if (raw.length === 0) {
				resolve({});
				return;
			}
			try {
				resolve(JSON.parse(raw));
			} catch {
				reject(/* @__PURE__ */ new Error("bad-json"));
			}
		});
		req.on("error", reject);
	});
}
/** Wrap one async usage read as a GET JSON route. */
function getRoute(path, run) {
	return {
		kind: "exact",
		path,
		handler: (req, res) => {
			if (!requireMethod(req, res, "GET")) return;
			Promise.resolve(run()).then((value) => json(res, 200, value), (error) => {
				json(res, 500, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				});
			});
		}
	};
}
/**
* The config editor routes: GET the masked view, POST new values to write.
* A successful write invalidates the usage cache so the next poll re-queries
* with the fresh cookie/workspace immediately (bypassing any cooldown).
*/
function makeConfigRoutes(service) {
	const read = () => maskedConfigView();
	const write = async (req) => {
		const body = await readJsonBody(req);
		const partial = {};
		for (const key of [
			"token",
			"apiKey",
			"cookie",
			"workspaceID"
		]) if (key in body) partial[key] = typeof body[key] === "string" ? body[key] : null;
		const view = writeConfigFile(partial);
		service.invalidateCache();
		return view;
	};
	return [{
		kind: "exact",
		path: `${OCGO_API_PREFIX}/config`,
		handler: (req, res) => {
			if (req.method === "GET") {
				Promise.resolve(read()).then((value) => json(res, 200, value), (error) => {
					json(res, 500, {
						ok: false,
						error: error instanceof Error ? error.message : String(error)
					});
				});
				return;
			}
			if (req.method === "POST") {
				Promise.resolve(write(req)).then((value) => json(res, 200, value), (error) => {
					json(res, 400, {
						ok: false,
						error: error instanceof Error ? error.message : String(error)
					});
				});
				return;
			}
			json(res, 405, {
				ok: false,
				error: "method-not-allowed"
			});
		}
	}];
}
/** Build the full usage API route family for one service. */
function makeOcgoRoutes(service) {
	return [
		getRoute(OCGO_API_PREFIX, () => service.view()),
		getRoute(`${OCGO_API_PREFIX}/refresh`, () => service.refresh()),
		...makeConfigRoutes(service)
	];
}
//#endregion
//#region src/api.ts
/** Error thrown by the HTTP / parsing layer; carries a short code for the UI. */
var UsageError = class extends Error {
	code;
	name = "UsageError";
	constructor(message, code) {
		super(message);
		this.code = code;
	}
};
/** Resolved console API base (the SPA's API lives under /console). */
const CONSOLE_API = "/console/api";
/** Typed JSON GET with structured errors (console JSON paths). */
async function safeFetchJson(url, headers, timeoutMs) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			method: "GET",
			headers,
			signal: controller.signal
		});
		if (!res.ok) throw new UsageError(`HTTP ${res.status} for ${sanitizeUrl(url)}`, `http${res.status}`);
		const text = await res.text();
		if (text.length === 0) throw new UsageError(`Empty response for ${sanitizeUrl(url)}`, "parse");
		try {
			return JSON.parse(text);
		} catch {
			throw new UsageError(`Unparseable response for ${sanitizeUrl(url)}`, "parse");
		}
	} catch (error) {
		if (error instanceof UsageError) throw error;
		throw new UsageError(error instanceof Error ? error.message : String(error), "network");
	} finally {
		clearTimeout(timer);
	}
}
/** Redact the query string / credentials from a URL for error messages. */
function sanitizeUrl(url) {
	try {
		const u = new URL(url);
		return `${u.origin}${u.pathname}`;
	} catch {
		return url;
	}
}
/** Common auth headers for one console request. */
function authHeaders(bearer, workspaceID) {
	return {
		authorization: `Bearer ${bearer}`,
		"x-org-id": workspaceID,
		accept: "application/json"
	};
}
/** Require at least one credential; normalize it into a bearer token. */
function resolveBearer(cfg) {
	return cfg.token ?? cfg.apiKey ?? cfg.cookie?.replace(/^auth=/, "")?.split(";")[0]?.trim();
}
/**
* Fetch the cumulative usage totals (console `usage/summary`).
* @throws {UsageError} when no credential/workspace is configured or the
* request fails.
*/
async function fetchTotals(cfg) {
	if (!cfg.workspaceID) throw new UsageError("Missing workspaceID for the console API", "noconfig");
	const bearer = resolveBearer(cfg);
	if (!bearer) throw new UsageError("Missing console token or API key", "noconfig");
	const url = `${cfg.baseUrl}${CONSOLE_API}/usage/summary`;
	try {
		const parsed = await safeFetchJson(url, authHeaders(bearer, cfg.workspaceID), cfg.timeoutMs);
		return {
			requests: sv(parsed.totalRequests, "0"),
			inputTokens: sv(parsed.totalInputTokens, "0"),
			outputTokens: sv(parsed.totalOutputTokens, "0"),
			cacheTokens: sv(parsed.totalCacheReadTokens, "0"),
			costMicroCents: sv(parsed.totalCostMicroCents, "0")
		};
	} catch (error) {
		if (error instanceof UsageError) throw error;
		throw error;
	}
}
/** Fetch the org monthly budget window (console `budgets/org`). */
async function fetchBudget(cfg) {
	if (!cfg.token || !cfg.workspaceID) throw new UsageError("Budget window requires the console token", "noconfig");
	const parsed = await safeFetchJson(`${cfg.baseUrl}${CONSOLE_API}/budgets/org`, authHeaders(cfg.token, cfg.workspaceID), cfg.timeoutMs);
	const limit = Number.parseInt(parsed.limitMicroCents ?? "0", 10);
	const spent = Number.parseInt(parsed.spentMicroCents ?? "0", 10);
	const percent = limit > 0 ? Math.min(100, Math.round(spent / limit * 100)) : 0;
	const resetsAt = parsed.resetsAt ? Date.parse(parsed.resetsAt) : NaN;
	return {
		percent,
		spentMicroCents: sv(parsed.spentMicroCents, "0"),
		limitMicroCents: sv(parsed.limitMicroCents, "0"),
		resetInSec: Number.isFinite(resetsAt) ? Math.max(0, Math.floor((resetsAt - Date.now()) / 1e3)) : 0,
		exceeded: parsed.exceeded === true || percent >= 100
	};
}
/** Fetch the prepaid balance (console `billing/status`). */
async function fetchBilling(cfg) {
	if (!cfg.token || !cfg.workspaceID) throw new UsageError("Billing requires the console token", "noconfig");
	const parsed = await safeFetchJson(`${cfg.baseUrl}${CONSOLE_API}/billing/status`, authHeaders(cfg.token, cfg.workspaceID), cfg.timeoutMs);
	return {
		balanceMicroCents: sv(parsed.balanceMicroCents, "0"),
		availableMicroCents: sv(parsed.availableMicroCents, sv(parsed.balanceMicroCents, "0")),
		mode: parsed.mode ?? "unknown"
	};
}
/**
* Fetch the full usage read: totals always; the budget window and balance
* when a console session token is configured (the API key alone cannot read
* them). Individual optional reads never fail the whole snapshot.
* @throws {UsageError} when nothing usable is configured or totals fail.
*/
async function fetchUsage(cfg) {
	const usage = await fetchTotals(cfg);
	const extra = {};
	if (cfg.token) {
		const [budget, billing] = await Promise.allSettled([fetchBudget(cfg), fetchBilling(cfg)]);
		if (budget.status === "fulfilled") extra.budget = budget.value;
		if (billing.status === "fulfilled") extra.billing = billing.value;
	}
	return {
		updatedAt: Date.now(),
		usage,
		...extra
	};
}
/** Coerce a possibly-absent response string into a string (JSON-safe). */
function sv(value, fallback) {
	return typeof value === "string" && value.length > 0 ? value : fallback;
}
//#endregion
//#region src/service.ts
/**
* dsh-ocgo-usage host service — the cached OpenCode Go usage read.
* Resolves the config (env + $DSH_HOME/ocgo-usage.json) on every refresh so
* a changed token reaches the next query without a plugin restart, fetches
* the console JSON endpoints, and caches the result so the browser readout
* can poll without spamming opencode.ai.
* @module dsh-ocgo-usage/service
*/
/** After a failed fetch, skip further provider queries for this long. */
const FAILURE_COOLDOWN_MS = 6e4;
/** Map a UsageError (or any error) to a browser-safe view. */
function errorView(error) {
	if (error instanceof UsageError) return {
		error: error.code,
		message: error.message
	};
	return {
		error: "fetch",
		message: error instanceof Error ? error.message : String(error)
	};
}
/**
* Cached OpenCode Go usage read. `view()` answers from a fresh cache,
* otherwise queries the provider (deduped when concurrent). A failed query
* enters a short cooldown so a broken config is not hammered by the poller.
*/
var OcgoUsageService = class extends Service {
	enabled;
	cached;
	cachedAt = 0;
	failureUntilMs = 0;
	lastError;
	inflight;
	constructor(ctx, config = {}) {
		super(ctx, "ocgoUsage");
		this.enabled = config.enabled ?? true;
	}
	/** Whether the service answers queries while enabled. */
	isEnabled() {
		return this.enabled;
	}
	/** Cache TTL from the live config (seconds → ms). */
	ttlMs() {
		return loadConfig().cacheTTL * 1e3;
	}
	/** RPC: most recent usage view. Returns the cached view when it is still
	* fresh, otherwise re-queries the provider (deduped when concurrent). */
	async view() {
		if (!this.enabled) return {
			error: "disabled",
			message: "The ocgo-usage plugin is disabled."
		};
		const now = Date.now();
		if (this.cached !== void 0 && now - this.cachedAt < this.ttlMs()) return toView(this.cached);
		if (now < this.failureUntilMs) return this.lastError ?? {
			error: "fetch",
			message: "Unknown failure"
		};
		if (this.inflight !== void 0) return this.inflight;
		this.inflight = this.query().then((view) => {
			if (view.error === void 0) this.lastError = void 0;
			else {
				this.lastError = view;
				this.failureUntilMs = Date.now() + FAILURE_COOLDOWN_MS;
			}
			return view;
		}).finally(() => {
			this.inflight = void 0;
		});
		return this.inflight;
	}
	/** RPC: force a fresh provider query (bypasses the cache window). */
	async refresh() {
		if (!this.enabled) return {
			error: "disabled",
			message: "The ocgo-usage plugin is disabled."
		};
		const view = await this.query();
		if (view.error === void 0) {
			this.lastError = void 0;
			this.failureUntilMs = 0;
		} else {
			this.lastError = view;
			this.failureUntilMs = Date.now() + FAILURE_COOLDOWN_MS;
		}
		return view;
	}
	/**
	* Drop the cached usage, the failure cooldown, and the last error so the
	* next read re-queries with the freshly written config. Called after a
	* config edit.
	*/
	invalidateCache() {
		this.cached = void 0;
		this.cachedAt = 0;
		this.failureUntilMs = 0;
		this.lastError = void 0;
	}
	async query() {
		try {
			const data = await fetchUsage(loadConfig());
			this.cached = data;
			this.cachedAt = Date.now();
			return toView(data);
		} catch (error) {
			return errorView(error);
		}
	}
};
/** Convert the internal normalized shape into the browser view. */
function toView(data) {
	return {
		updatedAt: data.updatedAt,
		usage: data.usage,
		...data.budget === void 0 ? {} : { budget: data.budget },
		...data.billing === void 0 ? {} : { billing: data.billing }
	};
}
//#endregion
//#region src/index.ts
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
const name = "ocgo-usage";
/** Services required before the usage service can answer. */
const inject = ["webServer"];
/** Register the usage service and its API routes on the context. */
function apply(ctx, config = {}) {
	const routes = makeOcgoRoutes(new OcgoUsageService(ctx, config));
	ctx.effect(() => {
		const disposers = routes.map((route) => ctx.webServer.register(route));
		return () => {
			for (const dispose of disposers) dispose();
		};
	}, "ocgo-usage: routes");
}
//#endregion
export { OCGO_API_PREFIX, OcgoUsageService, UsageError, apply, configFilePath, fetchUsage, inject, loadConfig, makeOcgoRoutes, name, normalizeCookie, normalizeToken };
