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
import { OcgoDockEntry } from "./OcgoDockEntry.js";
import { en, zh } from "./locales.js";
export { OCGO_PROVIDER } from "../provider.js";
export { OcgoDockEntry, formatDuration } from "./OcgoDockEntry.js";
/** Dictionary namespace owned by this plugin. */
const NS = 'ocgo';
/** Required services: slots for the composer tool-row entry, locale for the copy. */
export const inject = ['slots', 'locale'];
/** The pending selection wins; fall back to the last used one. */
function providerOf(view) {
    return view?.next?.provider ?? view?.lastUsed?.provider;
}
/** Read a service by its dotted name without declaring it as a hard dependency. */
function service(scope, name) {
    try {
        return scope.get(name);
    }
    catch {
        return undefined;
    }
}
/**
 * Resolve the CURRENT model provider of a session: the warm in-memory durable
 * projection first, the `session.projections` Remote as a fallback. Undefined
 * when neither path knows the session's selection yet.
 */
async function readProvider(scope, sessionId) {
    try {
        const sessions = service(scope, 'sessions');
        const view = sessions
            ?.binding?.(sessionId)
            ?.session?.projections?.faceOf?.('modelSelection')
            ?.getSnapshot?.();
        const provider = providerOf(view);
        if (provider !== undefined)
            return provider;
    }
    catch {
        // Fall through to the Remote read.
    }
    try {
        const remote = service(scope, 'remote.session');
        const result = await remote?.projections?.({ sessionId });
        if (result === undefined || !result.ok)
            return undefined;
        return providerOf(result.value?.values?.modelSelection);
    }
    catch {
        return undefined;
    }
}
/**
 * Register the usage chip into the composer tool row next to the model selector.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-ocgo-usage: dictionaries');
    ctx.inject(['slots', 'conversation'], (scope) => {
        scope.effect(() => scope.slots.register({
            name: 'conversation.input.right',
            id: 'ocgo-usage',
            order: 110,
            locale: NS,
            inject: (sessionId) => ({
                dockSessionId: sessionId,
                // The slot factory already carries the owning session id; the session
                // services are resolved lazily on every poll.
                provider: async () => await readProvider(scope, sessionId),
            }),
        }, OcgoDockEntry), 'dsh-ocgo-usage: chip registration');
    });
}
