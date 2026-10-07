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
import type { NormalizedUsage, OcgoConfig } from './types.ts';
/** Error thrown by the HTTP / parsing layer; carries a short code for the UI. */
export declare class UsageError extends Error {
    readonly code: string;
    readonly name = "UsageError";
    constructor(message: string, code: string);
}
/**
 * Fetch the full usage read: totals always; the budget window and balance
 * when a console session token is configured (the API key alone cannot read
 * them). Individual optional reads never fail the whole snapshot.
 * @throws {UsageError} when nothing usable is configured or totals fail.
 */
export declare function fetchUsage(cfg: OcgoConfig): Promise<NormalizedUsage>;
//# sourceMappingURL=api.d.ts.map