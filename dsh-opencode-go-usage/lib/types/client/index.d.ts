/**
 * dsh-ocgo-usage browser half — registers the OpenCode Go usage chip into
 * the composer tool row (`conversation.input.right`, next to the model
 * selector) and reads the host's same-origin `/api/ocgo-usage` JSON endpoints:
 * poll the host snapshot (every 10 s),
 * refresh on demand. The chip shows the three usage windows (rolling 5h /
 * weekly / monthly) in a compact form; while the host reports no usable data
 * (missing config, cookie error, or provider failure) it renders a compact
 * `<err:code>` state with a manual refresh action.
 *
 * Provider visibility is decided CLIENT-side from the live model selection,
 * in two steps so that switching models via `/model` shows up on the very next
 * poll without a network round-trip:
 *
 *  1. the in-memory durable `modelSelection` projection of the Session
 *     Controller client service (`sessions.binding(id).session.projections`),
 *     a warm ~ms read;
 *  2. the `session.projections` Remote as a fallback, which also covers a
 *     session whose scope is not retained yet.
 *
 * Both carry `{ lastUsed, next }` (`next` wins). The old `connection.api`
 * surface this plugin used before dsh 0.1.2 no longer exists, and its probe
 * failed silently — the chip hid itself in every session.
 *
 * The chip renders nothing while the current provider is not `opencode-go`,
 * mirroring pi-ocgo-usage.
 * @module dsh-ocgo-usage/client
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type OcgoKey } from './locales.ts';
export { OCGO_PROVIDER } from '../provider.ts';
export { OcgoDockEntry, formatDuration } from './OcgoDockEntry.tsx';
export type { OcgoDockEntryProps } from './OcgoDockEntry.tsx';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** dsh-ocgo-usage chip copy. */
        ocgo: OcgoKey;
    }
}
/** Required services: slots for the composer tool-row entry, locale for the copy. */
export declare const inject: string[];
/** The injected business face: the tool row's owning session plus a live provider read. */
export interface OcgoInjected {
    /** The session this dock entry renders for (slot inject factory arg). */
    dockSessionId: string | undefined;
    /**
     * Resolve the CURRENT model provider of the dock's session. Undefined when
     * the session has no selection yet (the chip then stays hidden).
     */
    provider(): Promise<string | undefined>;
}
/**
 * Register the usage chip into the composer tool row next to the model selector.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map