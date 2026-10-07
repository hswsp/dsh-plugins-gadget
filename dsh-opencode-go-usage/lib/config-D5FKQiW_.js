import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
const ENV_COOKIE = "OPENCODE_GO_COOKIE";
const ENV_WORKSPACE_ID = "OPENCODE_GO_WORKSPACE_ID";
const ENV_CACHE_TTL = "OPENCODE_GO_CACHE_TTL";
const ENV_TIMEOUT_MS = "OPENCODE_GO_TIMEOUT_MS";
const DEFAULT_BASE_URL = "https://opencode.ai";
const DEFAULT_TIMEOUT_MS = 1e4;
const MAX_CACHE_TTL = 3600;
/** Resolve the DSH home directory ($DSH_HOME or ~/.dsh). */
function dshHome() {
	const explicit = process.env.DSH_HOME;
	if (typeof explicit === "string" && explicit.length > 0) return explicit;
	return join(homedir(), ".dsh");
}
/** Resolved location of the plugin config file. */
function configFilePath() {
	return join(dshHome(), "ocgo-usage.json");
}
/**
* Load and merge config from file + env vars.
* Returns a fully resolved OcgoConfig; never throws.
*/
function loadConfig() {
	const fileConfig = readFileConfig();
	return {
		token: normalizeToken(process.env["OPENCODE_GO_CONSOLE_TOKEN"]) ?? normalizeToken(asString(fileConfig?.token)),
		apiKey: normalizeToken(process.env["OPENCODE_GO_API_KEY"]) ?? normalizeToken(asString(fileConfig?.apiKey)),
		cookie: normalizeCookie(pickString(process.env[ENV_COOKIE], asString(fileConfig?.cookie))),
		workspaceID: pickString(process.env[ENV_WORKSPACE_ID], asString(fileConfig?.workspaceID)),
		baseUrl: pickString(process.env["OPENCODE_GO_BASE_URL"], asString(fileConfig?.baseUrl)) || "https://opencode.ai",
		cacheTTL: clamp(pickNumber(process.env[ENV_CACHE_TTL], asNumber(fileConfig?.cacheTTL), 300), 60, MAX_CACHE_TTL),
		timeoutMs: Math.max(0, pickNumber(process.env[ENV_TIMEOUT_MS], asNumber(fileConfig?.timeoutMs), DEFAULT_TIMEOUT_MS))
	};
}
/** Mask the last 4 characters of a secret for the browser (full value when ≤ 4 chars). */
function maskSecret(value) {
	if (value === void 0 || value.length === 0) return {
		set: false,
		tail: ""
	};
	return {
		set: true,
		tail: value.length <= 4 ? value : value.slice(-4)
	};
}
/** The browser-facing masked config view (never reveals the full secret). */
function maskedConfigView() {
	const cfg = loadConfig();
	return {
		workspaceID: maskSecret(cfg.workspaceID),
		token: maskSecret(cfg.token),
		apiKey: maskSecret(cfg.apiKey)
	};
}
/** Normalize a pasted console token: trim whitespace, strip quotes. */
function normalizeToken(input) {
	if (!input) return void 0;
	const trimmed = input.trim().replace(/^"|"$/g, "");
	return trimmed.length > 0 ? trimmed : void 0;
}
/**
* Write token / apiKey / workspaceID (and legacy cookie) into the config file
* (preserving any other fields), chmod 600, and return the updated masked
* view. Empty/absent fields are left untouched; pass `null` to clear a field.
*/
function writeConfigFile(partial) {
	const next = { ...readFileConfig() ?? {} };
	if (partial.workspaceID !== void 0) {
		const v = typeof partial.workspaceID === "string" ? partial.workspaceID.trim() : "";
		if (v.length > 0) next.workspaceID = v;
		else delete next.workspaceID;
	}
	if (partial.token !== void 0) {
		const v = typeof partial.token === "string" ? normalizeToken(partial.token) : void 0;
		if (v !== void 0 && v.length > 0) next.token = v;
		else delete next.token;
	}
	if (partial.apiKey !== void 0) {
		const v = typeof partial.apiKey === "string" ? normalizeToken(partial.apiKey) : void 0;
		if (v !== void 0 && v.length > 0) next.apiKey = v;
		else delete next.apiKey;
	}
	if (partial.cookie !== void 0) {
		const v = typeof partial.cookie === "string" ? normalizeCookie(partial.cookie) : void 0;
		if (v !== void 0 && v.length > 0) next.cookie = v;
		else delete next.cookie;
	}
	const path = configFilePath();
	try {
		writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, { mode: 384 });
	} catch {
		return maskedConfigView();
	}
	return {
		workspaceID: maskSecret(typeof next.workspaceID === "string" ? next.workspaceID : void 0),
		token: maskSecret(typeof next.token === "string" ? next.token : void 0),
		apiKey: maskSecret(typeof next.apiKey === "string" ? next.apiKey : void 0)
	};
}
function readFileConfig() {
	const path = configFilePath();
	if (!existsSync(path)) return null;
	try {
		const raw = readFileSync(path, "utf8");
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed === "object") return parsed;
		return null;
	} catch {
		return null;
	}
}
function pickString(envVal, fileVal) {
	if (envVal && envVal.length > 0) return envVal;
	if (fileVal && fileVal.length > 0) return fileVal;
}
/**
* Normalize a user-provided cookie string into a valid `Cookie:` header value
* for the opencode console HTTP request.
*
* Accepts, order-independently:
*  1. Full header: "auth=Fe26.2*...; oc_locale=zh"   (passthrough)
*  2. Single bare value: "Fe26.2*..."                (auto-prefix "auth=")
*  3. Two-segment value+locale: "Fe26.2*...; oc_locale=zh"
*  4. Locale + auth in any order (incl. `oc_locale=zh` BEFORE `auth=`).
*
* If no `auth=` pair and no bare opaque token is present, `undefined` is
* returned so the caller REFUSES to persist a broken cookie rather than
* fabricating `auth=<locale>`. The `oc_locale` is preserved from the pasted
* cookie, defaulting to `en` when absent.
*/
function normalizeCookie(input) {
	if (!input) return void 0;
	const trimmed = input.trim();
	if (!trimmed) return void 0;
	const segments = trimmed.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
	let auth = segments.find((s) => /^auth=/i.test(s));
	if (auth === void 0) {
		const bare = segments.find((s) => !s.includes("=") && s.length >= 8);
		if (bare !== void 0) auth = `auth=${bare}`;
	}
	if (auth === void 0) return void 0;
	const authValue = auth.slice(auth.indexOf("=") + 1).trim().replace(/^"|"$/g, "");
	if (authValue.length === 0) return void 0;
	const localeSeg = segments.find((s) => /^oc_locale=/i.test(s));
	const rawLocale = localeSeg ? localeSeg.slice(localeSeg.indexOf("=") + 1).trim() : "";
	return `auth=${authValue}; oc_locale=${/^[A-Za-z]{2,3}$/.test(rawLocale) ? rawLocale.toLowerCase() : "en"}`;
}
function pickNumber(envVal, fileVal, fallback) {
	const fromEnv = envVal ? Number.parseInt(envVal, 10) : NaN;
	if (Number.isFinite(fromEnv)) return fromEnv;
	if (fileVal !== void 0 && Number.isFinite(fileVal)) return fileVal;
	return fallback;
}
function asString(v) {
	return typeof v === "string" && v.length > 0 ? v : void 0;
}
function asNumber(v) {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string") {
		const n = Number.parseInt(v, 10);
		if (Number.isFinite(n)) return n;
	}
}
function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n));
}
//#endregion
export { maskedConfigView as a, writeConfigFile as c, loadConfig as i, DEFAULT_TIMEOUT_MS as n, normalizeCookie as o, configFilePath as r, normalizeToken as s, DEFAULT_BASE_URL as t };
