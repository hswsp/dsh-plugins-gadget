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

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the ui-conversation SlotMap merge (the composer tool row entry).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { OCGO_PROVIDER } from '../provider.ts'
import { OcgoDockEntry, type OcgoDockEntryProps } from './OcgoDockEntry.tsx'
import { en, zh, type OcgoKey } from './locales.ts'

export { OCGO_PROVIDER } from '../provider.ts'

export { OcgoDockEntry, formatDuration } from './OcgoDockEntry.tsx'
export type { OcgoDockEntryProps } from './OcgoDockEntry.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** dsh-ocgo-usage chip copy. */
    ocgo: OcgoKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'ocgo'

/** Required services: slots for the composer tool-row entry, locale for the copy. */
export const inject = ['slots', 'locale']

/**
 * The `modelSelection` projection view, on both the in-memory and the Remote
 * path: the selection the session last really used, plus the pending one.
 */
interface ModelSelectionView {
  readonly lastUsed?: { readonly provider?: string } | null
  readonly next?: { readonly provider?: string } | null
}

/** The pending selection wins; fall back to the last used one. */
function providerOf(view: ModelSelectionView | undefined): string | undefined {
  return view?.next?.provider ?? view?.lastUsed?.provider
}

/**
 * Structural faces of the client services the provider read touches. Kept
 * local and optional on purpose: on a host without them the read degrades to
 * "unknown provider" (the chip stays hidden) instead of failing the plugin.
 */
interface SessionsFace {
  binding?(id: string): {
    readonly session?: {
      readonly projections?: {
        faceOf?(key: string): { getSnapshot?(): unknown } | undefined
      }
    }
  } | undefined
}

interface SessionRemoteFace {
  projections?(request: { sessionId: string }): Promise<
    { readonly ok: boolean; readonly value?: { readonly values?: Record<string, unknown> } } | undefined
  >
}

/** Read a service by its dotted name without declaring it as a hard dependency. */
function service<T>(scope: ClientContext, name: string): T | undefined {
  try {
    return (scope.get as unknown as (key: string) => T | undefined)(name)
  } catch {
    return undefined
  }
}

/**
 * Resolve the CURRENT model provider of a session: the warm in-memory durable
 * projection first, the `session.projections` Remote as a fallback. Undefined
 * when neither path knows the session's selection yet.
 */
async function readProvider(scope: ClientContext, sessionId: string): Promise<string | undefined> {
  try {
    const sessions = service<SessionsFace>(scope, 'sessions')
    const view = sessions
      ?.binding?.(sessionId)
      ?.session?.projections?.faceOf?.('modelSelection')
      ?.getSnapshot?.() as ModelSelectionView | undefined
    const provider = providerOf(view)
    if (provider !== undefined) return provider
  } catch {
    // Fall through to the Remote read.
  }
  try {
    const remote = service<SessionRemoteFace>(scope, 'remote.session')
    const result = await remote?.projections?.({ sessionId })
    if (result === undefined || !result.ok) return undefined
    return providerOf(result.value?.values?.modelSelection as ModelSelectionView | undefined)
  } catch {
    return undefined
  }
}

/** The injected business face: the tool row's owning session plus a live provider read. */
export interface OcgoInjected {
  /** The session this dock entry renders for (slot inject factory arg). */
  dockSessionId: string | undefined
  /**
   * Resolve the CURRENT model provider of the dock's session. Undefined when
   * the session has no selection yet (the chip then stays hidden).
   */
  provider(): Promise<string | undefined>
}

/**
 * Register the usage chip into the composer tool row next to the model selector.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-ocgo-usage: dictionaries')

  ctx.inject(['slots', 'conversation'], (scope: ClientContext) => {
    scope.effect(() => scope.slots.register({
      name: 'conversation.input.right',
      id: 'ocgo-usage',
      order: 110,
      locale: NS,
      inject: (sessionId): OcgoInjected => ({
        dockSessionId: sessionId,
        // The slot factory already carries the owning session id; the session
        // services are resolved lazily on every poll.
        provider: async () => await readProvider(scope, sessionId),
      }),
    }, OcgoDockEntry), 'dsh-ocgo-usage: chip registration')
  })
}
