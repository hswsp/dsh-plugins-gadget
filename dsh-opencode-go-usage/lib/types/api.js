/**
 * HTTP fetch + response adapters for dsh-ocgo-usage
 *
 * Console JSON API (current): the opencode console serves the Go usage
 * through authenticated JSON endpoints under `/console/api`, which the
 * browser SPA calls with the session. The legacy SSR page
 * (`/workspace/<wrk>/go`, `data-slot="usage-item"`) has been decommissioned.
 *
 * This client reads:
 *   - `GET /console/api/usage/summary`  — cumulative totals (requests /
 *     input / output / cache tokens / cost). Works with a console session
 *     token OR a service-account API key (`Authorization: Bearer`).
 *   - `GET /console/api/budgets/org`    — the org monthly budget window
 *     (limit / spent / reset), token-only.
 *   - `GET /console/api/billing/status` — prepaid balance, token-only.
 *
 * All requests carry `x-org-id: <workspaceID>`.
 * @module dsh-ocgo-usage/api
 */
// ============================================================================
// Errors
// ============================================================================
/** Error thrown by the HTTP / parsing layer; carries a short code for the UI. */
export class UsageError extends Error {
    code;
    name = 'UsageError';
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
// ============================================================================
// HTTP wrapper
// ============================================================================
/** Resolved console API base (the SPA's API lives under /console). */
const CONSOLE_API = '/console/api';
/** Typed JSON GET with structured errors (console JSON paths). */
async function safeFetchJson(url, headers, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            method: 'GET',
            headers,
            signal: controller.signal,
        });
        if (!res.ok) {
            // A 302/401/403 all mean "not authorized for this endpoint"; keep the
            // raw status so the chip can surface <err:http403> etc.
            throw new UsageError(`HTTP ${res.status} for ${sanitizeUrl(url)}`, `http${res.status}`);
        }
        const text = await res.text();
        if (text.length === 0) {
            throw new UsageError(`Empty response for ${sanitizeUrl(url)}`, 'parse');
        }
        try {
            return JSON.parse(text);
        }
        catch {
            throw new UsageError(`Unparseable response for ${sanitizeUrl(url)}`, 'parse');
        }
    }
    catch (error) {
        if (error instanceof UsageError)
            throw error;
        throw new UsageError(error instanceof Error ? error.message : String(error), 'network');
    }
    finally {
        clearTimeout(timer);
    }
}
/** Redact the query string / credentials from a URL for error messages. */
function sanitizeUrl(url) {
    try {
        const u = new URL(url);
        return `${u.origin}${u.pathname}`;
    }
    catch {
        return url;
    }
}
/** Common auth headers for one console request. */
function authHeaders(bearer, workspaceID) {
    return {
        authorization: `Bearer ${bearer}`,
        'x-org-id': workspaceID,
        accept: 'application/json',
    };
}
/** Require at least one credential; normalize it into a bearer token. */
function resolveBearer(cfg) {
    return cfg.token ?? cfg.apiKey ?? cfg.cookie?.replace(/^auth=/, '')?.split(';')[0]?.trim();
}
/**
 * Fetch the cumulative usage totals (console `usage/summary`).
 * @throws {UsageError} when no credential/workspace is configured or the
 * request fails.
 */
async function fetchTotals(cfg) {
    if (!cfg.workspaceID) {
        throw new UsageError('Missing workspaceID for the console API', 'noconfig');
    }
    const bearer = resolveBearer(cfg);
    if (!bearer) {
        throw new UsageError('Missing console token or API key', 'noconfig');
    }
    const url = `${cfg.baseUrl}${CONSOLE_API}/usage/summary`;
    try {
        const parsed = (await safeFetchJson(url, authHeaders(bearer, cfg.workspaceID), cfg.timeoutMs));
        return {
            requests: sv(parsed.totalRequests, '0'),
            inputTokens: sv(parsed.totalInputTokens, '0'),
            outputTokens: sv(parsed.totalOutputTokens, '0'),
            cacheTokens: sv(parsed.totalCacheReadTokens, '0'),
            costMicroCents: sv(parsed.totalCostMicroCents, '0'),
        };
    }
    catch (error) {
        // Re-map the HTTP 302/401/403 into clear actionable codes.
        if (error instanceof UsageError)
            throw error;
        throw error;
    }
}
/** Fetch the org monthly budget window (console `budgets/org`). */
async function fetchBudget(cfg) {
    if (!cfg.token || !cfg.workspaceID) {
        throw new UsageError('Budget window requires the console token', 'noconfig');
    }
    const url = `${cfg.baseUrl}${CONSOLE_API}/budgets/org`;
    const parsed = (await safeFetchJson(url, authHeaders(cfg.token, cfg.workspaceID), cfg.timeoutMs));
    const limit = Number.parseInt(parsed.limitMicroCents ?? '0', 10);
    const spent = Number.parseInt(parsed.spentMicroCents ?? '0', 10);
    const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
    const resetsAt = parsed.resetsAt ? Date.parse(parsed.resetsAt) : NaN;
    return {
        percent,
        spentMicroCents: sv(parsed.spentMicroCents, '0'),
        limitMicroCents: sv(parsed.limitMicroCents, '0'),
        resetInSec: Number.isFinite(resetsAt)
            ? Math.max(0, Math.floor((resetsAt - Date.now()) / 1000))
            : 0,
        exceeded: parsed.exceeded === true || percent >= 100,
    };
}
/** Fetch the prepaid balance (console `billing/status`). */
async function fetchBilling(cfg) {
    if (!cfg.token || !cfg.workspaceID) {
        throw new UsageError('Billing requires the console token', 'noconfig');
    }
    const url = `${cfg.baseUrl}${CONSOLE_API}/billing/status`;
    const parsed = (await safeFetchJson(url, authHeaders(cfg.token, cfg.workspaceID), cfg.timeoutMs));
    return {
        balanceMicroCents: sv(parsed.balanceMicroCents, '0'),
        availableMicroCents: sv(parsed.availableMicroCents, sv(parsed.balanceMicroCents, '0')),
        mode: parsed.mode ?? 'unknown',
    };
}
/**
 * Fetch the full usage read: totals always; the budget window and balance
 * when a console session token is configured (the API key alone cannot read
 * them). Individual optional reads never fail the whole snapshot.
 * @throws {UsageError} when nothing usable is configured or totals fail.
 */
export async function fetchUsage(cfg) {
    const usage = await fetchTotals(cfg);
    const extra = {};
    if (cfg.token) {
        const [budget, billing] = await Promise.allSettled([
            fetchBudget(cfg),
            fetchBilling(cfg),
        ]);
        if (budget.status === 'fulfilled')
            extra.budget = budget.value;
        if (billing.status === 'fulfilled')
            extra.billing = billing.value;
    }
    return { updatedAt: Date.now(), usage, ...extra };
}
/** Coerce a possibly-absent response string into a string (JSON-safe). */
function sv(value, fallback) {
    return typeof value === 'string' && value.length > 0 ? value : fallback;
}
