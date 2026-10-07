/**
 * Configuration loader for dsh-ocgo-usage
 *
 * Priority: env vars > config file ($DSH_HOME/ocgo-usage.json) > built-in defaults
 *
 * The token/API key/cookie are NEVER logged. If the config file is missing or
 * unparseable, we silently fall back to env vars + defaults — the browser
 * readout shows a clean `noconfig` error if no source provides a usable
 * credential.
 *
 * Env var names match the OpenCode ecosystem (`OPENCODE_GO_*`) so one shell
 * profile works for both dsh and the opencode CLI.
 *
 * The browser config editor (`/api/ocgo-usage/config`) reads a MASKED view
 * (never the full secret) and writes back through {@link writeConfigFile}.
 * @module dsh-ocgo-usage/config
 */
import type { MaskedConfigView, MaskedSecret, OcgoConfig } from './types.ts';
export declare const ENV_TOKEN = "OPENCODE_GO_CONSOLE_TOKEN";
export declare const ENV_API_KEY = "OPENCODE_GO_API_KEY";
export declare const ENV_COOKIE = "OPENCODE_GO_COOKIE";
export declare const ENV_WORKSPACE_ID = "OPENCODE_GO_WORKSPACE_ID";
export declare const ENV_BASE_URL = "OPENCODE_GO_BASE_URL";
export declare const ENV_CACHE_TTL = "OPENCODE_GO_CACHE_TTL";
export declare const ENV_TIMEOUT_MS = "OPENCODE_GO_TIMEOUT_MS";
export declare const DEFAULT_BASE_URL = "https://opencode.ai";
export declare const DEFAULT_CACHE_TTL = 300;
export declare const DEFAULT_TIMEOUT_MS = 10000;
export declare const MIN_CACHE_TTL = 60;
export declare const MAX_CACHE_TTL = 3600;
/** Resolve the DSH home directory ($DSH_HOME or ~/.dsh). */
export declare function dshHome(): string;
/** Resolved location of the plugin config file. */
export declare function configFilePath(): string;
/**
 * Load and merge config from file + env vars.
 * Returns a fully resolved OcgoConfig; never throws.
 */
export declare function loadConfig(): OcgoConfig;
/** Mask the last 4 characters of a secret for the browser (full value when ≤ 4 chars). */
export declare function maskSecret(value: string | undefined): MaskedSecret;
/** The browser-facing masked config view (never reveals the full secret). */
export declare function maskedConfigView(): MaskedConfigView;
/** Normalize a pasted console token: trim whitespace, strip quotes. */
export declare function normalizeToken(input: string | undefined): string | undefined;
/**
 * Write token / apiKey / workspaceID (and legacy cookie) into the config file
 * (preserving any other fields), chmod 600, and return the updated masked
 * view. Empty/absent fields are left untouched; pass `null` to clear a field.
 */
export declare function writeConfigFile(partial: {
    token?: string | null;
    apiKey?: string | null;
    cookie?: string | null;
    workspaceID?: string | null;
}): MaskedConfigView;
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
export declare function normalizeCookie(input: string | undefined): string | undefined;
//# sourceMappingURL=config.d.ts.map