/**
 * Unit tests for the console JSON API client.
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
    token: 'st_test-token',
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

describe('fetchUsage', () => {
  it('noconfig without any credential', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await expect(fetchUsage(config({ token: undefined, apiKey: undefined }))).rejects.toMatchObject({
      code: 'noconfig',
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('noconfig without a workspace id', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await expect(fetchUsage(config({ workspaceID: undefined }))).rejects.toMatchObject({
      code: 'noconfig',
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('parses totals and calls the console API with Bearer + x-org-id', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SUMMARY))
    const data = await fetchUsage(config({ token: undefined, apiKey: 'sc-key' }))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://opencode.ai/console/api/usage/summary')
    const headers = new Headers(init.headers)
    expect(headers.get('authorization')).toBe('Bearer sc-key')
    expect(headers.get('x-org-id')).toBe('wrk_test')
    expect(data.usage).toEqual({
      requests: '2120',
      inputTokens: '6952444',
      outputTokens: '1614687',
      cacheTokens: '414611757',
      costMicroCents: '443820552',
    })
    // api-key mode has no budget/billing.
    expect(data.budget).toBeUndefined()
    expect(data.billing).toBeUndefined()
  })

  it('adds budget + billing when a console token is present', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(SUMMARY))
      .mockResolvedValueOnce(jsonResponse(BUDGET))
      .mockResolvedValueOnce(jsonResponse(BILLING))
    const data = await fetchUsage(config({ token: 'st_session' }))
    expect(fetchSpy).toHaveBeenCalledTimes(3)
    expect(data.budget).toBeDefined()
    expect(data.budget?.percent).toBe(25) // 2.5e8 / 1e9
    expect(data.budget?.exceeded).toBe(false)
    expect(data.budget?.resetInSec).toBeGreaterThan(0)
    expect(data.billing?.balanceMicroCents).toBe('500000000')
  })

  it('marks the budget exceeded when spent >= limit', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(SUMMARY))
      .mockResolvedValueOnce(jsonResponse({ ...BUDGET, spentMicroCents: '1000000000' }))
      .mockResolvedValueOnce(jsonResponse(BILLING))
    const data = await fetchUsage(config({ token: 'st_session' }))
    expect(data.budget?.percent).toBe(100)
    expect(data.budget?.exceeded).toBe(true)
  })

  it('tolerates budget/billing failures without failing the totals', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(SUMMARY))
      .mockResolvedValueOnce(jsonResponse({ _tag: 'Unauthorized' }, 403))
      .mockResolvedValueOnce(jsonResponse({ _tag: 'Unauthorized' }, 403))
    const data = await fetchUsage(config({ token: 'st_session' }))
    expect(data.usage.requests).toBe('2120')
    expect(data.budget).toBeUndefined()
    expect(data.billing).toBeUndefined()
  })

  it('maps an HTTP failure on the totals to http<status>', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ _tag: 'Unauthorized' }, 401))
    await expect(fetchUsage(config({ token: 'st_bad' }))).rejects.toThrowError(UsageError)
    await expect(fetchUsage(config({ token: 'st_bad' }))).rejects.toMatchObject({ code: 'http401' })
  })

  it('maps a malformed body to parse', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html>login</html>', { status: 200, headers: { 'content-type': 'text/html' } }),
    )
    await expect(fetchUsage(config({ token: 'st_parse' }))).rejects.toMatchObject({ code: 'parse' })
  })
})