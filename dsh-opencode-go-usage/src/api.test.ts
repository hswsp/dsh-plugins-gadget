/**
 * Unit tests for the usage API client (zen windows + console JSON paths).
 * @module dsh-ocgo-usage/api.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UsageError, fetchUsage } from './api.ts'
import type { OcgoConfig } from './types.ts'

beforeEach(() => {
  vi.restoreAllMocks()
})

function config(overrides: Partial<OcgoConfig>): OcgoConfig {
  return {
    apiKey: 'sc-zen-key',
    workspaceID: 'wrk_test',
    baseUrl: 'https://opencode.ai',
    cacheTTL: 300,
    timeoutMs: 5000,
    ...overrides,
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function zenResponse(percent: [number, number, number] = [8, 10, 12]): unknown {
  const [rolling, weekly, monthly] = percent
  return {
    usage: {
      rolling: { status: 'ok', percent: rolling, resetsAt: new Date(Date.now() + 3600e3).toISOString() },
      weekly: { status: 'ok', percent: weekly, resetsAt: new Date(Date.now() + 86400e3 * 5).toISOString() },
      monthly: { status: 'ok', percent: monthly, resetsAt: new Date(Date.now() + 86400e3 * 12).toISOString() },
    },
  }
}

const SUMMARY = {
  totalRequests: '2120',
  totalInputTokens: '6952444',
  totalOutputTokens: '1614687',
  totalCacheReadTokens: '414611757',
  totalCostMicroCents: '443820552',
}

const BUDGET = {
  scope: 'org',
  limitMicroCents: '1000000000',
  spentMicroCents: '250000000',
  exceeded: false,
  resetsAt: new Date(Date.now() + 86400 * 10).toISOString(),
}

const BILLING = {
  balanceMicroCents: '500000000',
  availableMicroCents: '500000000',
  mode: 'pay-as-you-go',
}

describe('fetchUsage — zen windows path (API key)', () => {
  it('noconfig without any credential', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await expect(fetchUsage(config({ apiKey: undefined, token: undefined }))).rejects.toMatchObject({
      code: 'noconfig',
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fetches the three plan windows plus console totals with Bearer auth', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(zenResponse()))
      .mockResolvedValueOnce(jsonResponse(SUMMARY))
    const data = await fetchUsage(config({ apiKey: 'sc-zen-key' }))
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    const [zenUrl, zenInit] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(zenUrl).toBe('https://opencode.ai/zen/go/v1/usage')
    expect(new Headers(zenInit.headers).get('authorization')).toBe('Bearer sc-zen-key')
    expect(data.rolling).toMatchObject({ kind: 'rolling', percent: 8, status: 'ok' })
    expect(data.weekly).toMatchObject({ kind: 'weekly', percent: 10, status: 'ok' })
    expect(data.monthly).toMatchObject({ kind: 'monthly', percent: 12, status: 'ok' })
    expect(data.rolling?.resetInSec).toBeGreaterThan(0)
    // The console totals stay visible alongside the windows.
    expect(data.usage?.requests).toBe('2120')
  })

  it('marks a non-ok window as rate-limited and clamps the percent', async () => {
    const body = {
      usage: {
        rolling: { status: 'rate_limited', percent: 120, resetsAt: new Date(Date.now() + 60e3).toISOString() },
      },
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(body))
    const data = await fetchUsage(config({ apiKey: 'sc-zen-key' }))
    expect(data.rolling).toMatchObject({ percent: 100, status: 'rate-limited' })
    expect(data.weekly).toBeUndefined()
  })

  it('maps an HTTP failure to http<status>', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ error: { type: 'AuthError' } }, 401))
    await expect(fetchUsage(config({ apiKey: 'bad' }))).rejects.toMatchObject({ code: 'http401' })
  })
})

describe('fetchUsage — console path (token fallback)', () => {
  it('parses totals and budget/billing from the console API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(SUMMARY))
      .mockResolvedValueOnce(jsonResponse(BUDGET))
      .mockResolvedValueOnce(jsonResponse(BILLING))
    const data = await fetchUsage(config({ apiKey: undefined, token: 'st_session' }))
    expect(fetchSpy).toHaveBeenCalledTimes(3)
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://opencode.ai/console/api/usage/summary')
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer st_session')
    expect(data.usage?.requests).toBe('2120')
    expect(data.budget?.percent).toBe(25)
    expect(data.billing?.balanceMicroCents).toBe('500000000')
    expect(data.rolling).toBeUndefined()
  })

  it('tolerates budget/billing failures without failing the totals', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(SUMMARY))
      .mockResolvedValueOnce(jsonResponse({ _tag: 'Unauthorized' }, 403))
      .mockResolvedValueOnce(jsonResponse({ _tag: 'Unauthorized' }, 403))
    const data = await fetchUsage(config({ apiKey: undefined, token: 'st_session' }))
    expect(data.usage?.requests).toBe('2120')
    expect(data.budget).toBeUndefined()
    expect(data.billing).toBeUndefined()
  })

  it('api-key + token merge all surfaces', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(zenResponse()))
      .mockResolvedValueOnce(jsonResponse(SUMMARY))
      .mockResolvedValueOnce(jsonResponse(BUDGET))
      .mockResolvedValueOnce(jsonResponse(BILLING))
    const data = await fetchUsage(config({ apiKey: 'sc-zen-key', token: 'st_session' }))
    expect(fetchSpy).toHaveBeenCalledTimes(4)
    expect(data.rolling).toBeDefined()
    expect(data.usage?.requests).toBe('2120')
    expect(data.budget?.percent).toBe(25)
    expect(data.billing?.balanceMicroCents).toBe('500000000')
  })

  it('maps a malformed body to parse', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html>login</html>', { status: 200, headers: { 'content-type': 'text/html' } }),
    )
    await expect(fetchUsage(config({ apiKey: 'sc-zen-key' }))).rejects.toMatchObject({ code: 'parse' })
  })
})

describe('UsageError', () => {
  it('carries a code', () => {
    const e = new UsageError('boom', 'http500')
    expect(e).toBeInstanceOf(Error)
    expect(e.code).toBe('http500')
    expect(e.message).toBe('boom')
  })
})