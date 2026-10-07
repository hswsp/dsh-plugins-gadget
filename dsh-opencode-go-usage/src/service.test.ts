/**
 * Unit tests for the cached usage service.
 * @module dsh-ocgo-usage/service.test
 */

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ENV_API_KEY, ENV_COOKIE, ENV_TOKEN, ENV_WORKSPACE_ID } from './config.ts'
import { OcgoUsageService } from './service.ts'

const SAVED = {
  token: process.env[ENV_TOKEN],
  apiKey: process.env[ENV_API_KEY],
  cookie: process.env[ENV_COOKIE],
  workspace: process.env[ENV_WORKSPACE_ID],
}

const SUMMARY = {
  totalRequests: '2120',
  totalInputTokens: '6952444',
  totalOutputTokens: '1614687',
  totalCacheReadTokens: '414611757',
  totalCostMicroCents: '443820552',
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('OcgoUsageService', () => {
  let ctx: Context
  let tmp: string

  beforeEach(() => {
    // API-key mode: one fetch per query, so the fetch-count assertions below
    // stay stable (the token mode fans out to budget/billing as well).
    delete process.env[ENV_TOKEN]
    process.env[ENV_API_KEY] = 'sc_test-key'
    process.env[ENV_WORKSPACE_ID] = 'wrk_test'
    tmp = mkdtempSync(join(tmpdir(), 'dsh-ocgo-usage-svc-'))
    process.env.DSH_HOME = tmp
    ctx = new Context()
  })

  afterEach(() => {
    // Restore mocks FIRST so a failure below cannot leak state into the
    // next test. Cordis 4 exposes no public Context.dispose, and the service
    // owns no timers/subscriptions, so the test context is left for the
    // worker process to reclaim.
    vi.restoreAllMocks()
    for (const [key, saved] of Object.entries(SAVED)) {
      const envKey = { token: ENV_TOKEN, apiKey: ENV_API_KEY, cookie: ENV_COOKIE, workspace: ENV_WORKSPACE_ID }[key as keyof typeof SAVED]
      if (saved === undefined) delete process.env[envKey]
      else process.env[envKey] = saved
    }
    delete process.env.DSH_HOME
    rmSync(tmp, { recursive: true, force: true })
  })

  it('returns the parsed totals on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SUMMARY))
    const service = new OcgoUsageService(ctx)
    const view = await service.view()
    expect(view.error).toBeUndefined()
    expect(view.usage?.requests).toBe('2120')
    expect(view.usage?.costMicroCents).toBe('443820552')
    expect(view.updatedAt).toBeTypeOf('number')
  })

  it('deduplicates concurrent view() calls into one fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SUMMARY))
    const service = new OcgoUsageService(ctx)
    const [a, b] = await Promise.all([service.view(), service.view()])
    expect(a.usage?.requests).toBe('2120')
    expect(b.usage?.requests).toBe('2120')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('serves the cached view within the TTL without refetching', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SUMMARY))
    const service = new OcgoUsageService(ctx)
    await service.view()
    await service.view()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('returns a noconfig error when no credential is set', async () => {
    delete process.env[ENV_TOKEN]
    delete process.env[ENV_API_KEY]
    delete process.env[ENV_COOKIE]
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SUMMARY))
    const service = new OcgoUsageService(ctx)
    const view = await service.view()
    expect(view.error).toBe('noconfig')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('maps an HTTP failure to an http<status> code and enters cooldown', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, 500))
    const service = new OcgoUsageService(ctx)
    const first = await service.view()
    expect(first.error).toBe('http500')
    // Cooldown: the second call reuses the error without fetching again.
    const second = await service.view()
    expect(second.error).toBe('http500')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('refresh() bypasses the cache window', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SUMMARY))
    const service = new OcgoUsageService(ctx)
    await service.view()
    await service.refresh()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('answers disabled when the plugin is switched off', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SUMMARY))
    const service = new OcgoUsageService(ctx, { enabled: false })
    const view = await service.view()
    expect(view.error).toBe('disabled')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})