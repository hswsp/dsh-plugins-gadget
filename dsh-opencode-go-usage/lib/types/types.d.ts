/**
 * Shared types for dsh-ocgo-usage.
 * @module dsh-ocgo-usage/types
 */
/** One of the three OpenCode Go usage windows. */
export type UsageWindowKind = 'rolling' | 'weekly' | 'monthly';
/** Whether the window is still usable or the account is rate-limited. */
export type UsageStatus = 'ok' | 'rate-limited';
/** One usage window: percent used + seconds until reset. */
export interface UsageWindow {
    /** Window identity. */
    readonly kind: UsageWindowKind;
    /** 0–100 integer percent. */
    readonly percent: number;
    /** Seconds until the window resets. */
    readonly resetInSec: number;
    /** `rate-limited` when the window is exhausted. */
    readonly status: UsageStatus;
}
/** The org monthly budget window (opencode console `budgets/org`). */
export interface BudgetWindow {
    /** 0–100 integer percent of the limit used this month. */
    readonly percent: number;
    /** Spent so far in the window (μ$). */
    readonly spentMicroCents: string;
    /** Window limit (μ$). */
    readonly limitMicroCents: string;
    /** Seconds until the window resets. */
    readonly resetInSec: number;
    /** True when the budget is used up. */
    readonly exceeded: boolean;
}
/** Cumulative usage totals (opencode console `usage/summary`). */
export interface UsageTotals {
    readonly requests: string;
    readonly inputTokens: string;
    readonly outputTokens: string;
    readonly cacheTokens: string;
    readonly costMicroCents: string;
}
/** Prepaid balance (opencode console `billing/status`). */
export interface BillingInfo {
    readonly balanceMicroCents: string;
    readonly availableMicroCents: string;
    readonly mode: string;
}
/** Normalized usage shape shared by every fetch path. */
export interface NormalizedUsage {
    /** Epoch ms of the last successful fetch (data freshness). */
    readonly updatedAt: number;
    /** Window path (API key, `zen/go/v1/usage`): the three plan windows. */
    readonly rolling?: UsageWindow;
    readonly weekly?: UsageWindow;
    readonly monthly?: UsageWindow;
    /** Console path (session token): cumulative totals. */
    readonly usage?: UsageTotals;
    /** Console path (session token): monthly budget window. */
    readonly budget?: BudgetWindow;
    /** Console path (session token): prepaid balance. */
    readonly billing?: BillingInfo;
}
/** Fully resolved plugin configuration (env + config file + defaults). */
export interface OcgoConfig {
    /**
     * Service-account API key. PRIMARY credential: unlocks the three plan
     * windows through `https://opencode.ai/zen/go/v1/usage`.
     */
    readonly apiKey?: string;
    /**
     * OpenCode console session token (the `__Host-console_session` value,
     * e.g. `st_...`). FALLBACK credential: unlocks the console JSON API
     * (cumulative totals / budget / balance) when no API key is set.
     */
    readonly token?: string;
    /** Legacy session cookie (old `auth=Fe26.2*...` path), kept for
     * compatibility; the console now prefers `token`. */
    readonly cookie?: string;
    /** OpenCode workspace id (e.g. `wrk_01...`), used by the console path. */
    readonly workspaceID?: string;
    /** API base URL. */
    readonly baseUrl: string;
    /** Cache TTL in seconds, clamped to [60, 3600]. */
    readonly cacheTTL: number;
    /** HTTP timeout in milliseconds. */
    readonly timeoutMs: number;
}
/** The browser-facing snapshot served by the host JSON endpoint. */
export interface OcgoUsageView {
    /** Epoch ms of the last successful fetch (absent before any success). */
    readonly updatedAt?: number;
    readonly rolling?: UsageWindow;
    readonly weekly?: UsageWindow;
    readonly monthly?: UsageWindow;
    readonly usage?: UsageTotals;
    readonly budget?: BudgetWindow;
    readonly billing?: BillingInfo;
    /** Machine-readable error code, present only on failure. */
    readonly error?: string;
    /** Human-readable failure detail (never contains a token/cookie). */
    readonly message?: string;
}
/** One masked secret field for the browser config editor (never the full value). */
export interface MaskedSecret {
    /** Whether a value is currently set (env or config file). */
    readonly set: boolean;
    /** The last 4 characters of the value (full value when ≤ 4 chars). */
    readonly tail: string;
}
/** The browser-facing config view: which fields are set, masked. */
export interface MaskedConfigView {
    readonly workspaceID: MaskedSecret;
    readonly token: MaskedSecret;
    readonly apiKey: MaskedSecret;
}
//# sourceMappingURL=types.d.ts.map