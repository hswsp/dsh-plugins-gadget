/**
 * dsh-ocgo-usage host half — mounts the usage service and its HTTP routes.
 * The browser half (the `./client` entry) reads the OpenCode Go usage
 * snapshot (cumulative totals + monthly budget window + prepaid balance)
 * through the same-origin `/api/ocgo-usage` JSON endpoints. Install via
 * `dsh plugin --profile web add <path-or-git-url>`; the cordis.patch.yml
 * inserts this plugin row.
 * @module dsh-ocgo-usage
 */
import { Context } from '@deepseek-ai/cordis';
import { type OcgoUsageConfig } from './service.ts';
export { OcgoUsageService } from './service.ts';
export type { OcgoUsageConfig, OcgoUsageView } from './service.ts';
export { OCGO_API_PREFIX, makeOcgoRoutes } from './routes.ts';
export { loadConfig, normalizeCookie, normalizeToken, configFilePath } from './config.ts';
export type { BillingInfo, BudgetWindow, NormalizedUsage, OcgoConfig, UsageStatus, UsageTotals, UsageWindow, UsageWindowKind } from './types.ts';
export { fetchUsage, UsageError } from './api.ts';
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
export declare const name = "ocgo-usage";
/** Services required before the usage service can answer. */
export declare const inject: string[];
/** Register the usage service and its API routes on the context. */
export declare function apply(ctx: Context, config?: OcgoUsageConfig): void;
//# sourceMappingURL=index.d.ts.map