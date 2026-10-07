/**
 * The composer tool-row entry: the OpenCode Go usage readout, mounted in the
 * composer tool row (`conversation.input.right`) next to the model selector.
 * The chip polls the host `/api/ocgo-usage` snapshot and renders:
 *  - the three plan windows (5h rolling / weekly / monthly) when an API key
 *    is configured (`zen/go/v1/usage`), or
 *  - the console metrics (cumulative totals + monthly budget + balance) when
 *    only a session token is configured.
 * Clicking reveals a detail panel, a Set editor (masked workspace/token/api
 * key) and a manual refresh. In the error state, clicking the chip opens the
 * Set editor directly so a stale credential can be replaced in place.
 * @module dsh-ocgo-usage/client/OcgoDockEntry
 */
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from './locales.ts';
/** Composed props of the dock entry (runtime + locale + injected session/provider face). */
export type OcgoDockEntryProps = PropsRuntime<'conversation.input.right'> & PropsLocale<typeof NS> & {
    dockSessionId?: string | undefined;
    provider?: () => Promise<string | undefined>;
};
/**
 * Format a duration (seconds) compactly: 45s / 23m / 5h 23m / 4d 6h.
 */
export declare function formatDuration(totalSec: number): string;
/** Micro-cents (10⁻⁸ USD) → a compact currency string, e.g. `$4.44` / `$4438.21`. */
export declare function formatUsd(microCents: string | undefined): string;
/** Token / request counts → compact units, e.g. `7.0M` / `2.1k`. */
export declare function formatCount(raw: string | undefined): string;
/**
 * The OpenCode Go usage chip: polls the host snapshot, renders the three plan
 * windows (or the console metrics), and expands into a detail panel on click.
 * @param props - the composed dock entry props.
 */
export declare function OcgoDockEntry(props: OcgoDockEntryProps): React.ReactElement | null;
//# sourceMappingURL=OcgoDockEntry.d.ts.map