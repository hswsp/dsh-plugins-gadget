/**
 * Unit tests for the configuration loader.
 * @module dsh-ocgo-usage/config.test
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_BASE_URL,
  DEFAULT_CACHE_TTL,
  DEFAULT_TIMEOUT_MS,
  ENV_API_KEY,
  ENV_BASE_URL,
  ENV_CACHE_TTL,
  ENV_COOKIE,
  ENV_TIMEOUT_MS,
  ENV_TOKEN,
  ENV_WORKSPACE_ID,
  loadConfig,
  maskSecret,
  maskedConfigView,
  normalizeCookie,
  normalizeToken,
  writeConfigFile,
} from './config.ts'

const ENV_KEYS = [
  ENV_TOKEN,
  ENV_API_KEY,
  ENV_COOKIE,
  ENV_WORKSPACE_ID,
  ENV_BASE_URL,
  ENV_CACHE_TTL,
  ENV_TIMEOUT_MS,
  'DSH_HOME',
]

/** Clear every env var the config reads, remembering the previous values. */
function clearEnv(): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {}
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key]
    delete process.env[key]
  }
  return saved
}

function restoreEnv(saved: Record<string, string | undefined>): void {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key]
    else process.env[key] = saved[key]
  }
}

describe('normalizeToken', () => {
  it('trims and strips quotes', () => {
    expect(normalizeToken('  st_abc ')).toBe('st_abc')
    expect(normalizeToken('"st_abc"')).toBe('st_abc')
    expect(normalizeToken('')).toBeUndefined()
    expect(normalizeToken('   ')).toBeUndefined()
    expect(normalizeToken(undefined)).toBeUndefined()
  })
})

describe('normalizeCookie', () => {
  it('passes through a full header and preserves its locale', () => {
    expect(normalizeCookie('auth=Fe26.2*abc; oc_locale=zh')).toBe('auth=Fe26.2*abc; oc_locale=zh')
    expect(normalizeCookie('auth=Fe26.2*abc')).toBe('auth=Fe26.2*abc; oc_locale=en')
  })

  it('prefixes auth= onto a bare auth value', () => {
    expect(normalizeCookie('Fe26.2*abc')).toBe('auth=Fe26.2*abc; oc_locale=en')
  })

  it('preserves a pasted locale (zh stays zh, ja stays ja)', () => {
    expect(normalizeCookie('Fe26.2*abc; oc_locale=zh')).toBe('auth=Fe26.2*abc; oc_locale=zh')
    expect(normalizeCookie('Fe26.2*abc; oc_locale=ja')).toBe('auth=Fe26.2*abc; oc_locale=ja')
  })

  it('falls back to en when the locale is absent or malformed', () => {
    expect(normalizeCookie('auth=Fe26.2*abc')).toBe('auth=Fe26.2*abc; oc_locale=en')
    expect(normalizeCookie('auth=Fe26.2*abc; oc_locale=')).toBe('auth=Fe26.2*abc; oc_locale=en')
    expect(normalizeCookie('auth=Fe26.2*abc; oc_locale=verylonglocale')).toBe(
      'auth=Fe26.2*abc; oc_locale=en',
    )
  })

  it('is order-independent and never corrupts locale-first cookies (regression)', () => {
    // The old code turned "oc_locale=zh; ...; auth=..." into
    // "auth=oc_locale=zh; ...". This must never happen.
    expect(normalizeCookie('oc_locale=zh; auth=Fe26.2*abc')).toBe('auth=Fe26.2*abc; oc_locale=zh')
    expect(normalizeCookie('oc_locale=en; desktop_promo_dismissed=1; auth=Fe26.2*abc')).toBe(
      'auth=Fe26.2*abc; oc_locale=en',
    )
  })

  it('accepts comma-separated cookies (Set-Cookie style)', () => {
    expect(normalizeCookie('oc_locale=zh, desktop_promo_dismissed=1, auth=Fe26.2*abc')).toBe(
      'auth=Fe26.2*abc; oc_locale=zh',
    )
  })

  it('accepts a quoted auth value', () => {
    expect(normalizeCookie('auth="Fe26.2*quoted"; oc_locale=en')).toBe(
      'auth=Fe26.2*quoted; oc_locale=en',
    )
  })

  it('rejects input with no real auth token (no fake auth=)', () => {
    // Regression: the old code fabricated "auth=oc_locale=zh; ..." from a
    // locale-only paste. Now it refuses instead.
    expect(normalizeCookie('oc_locale=zh')).toBeUndefined()
    expect(normalizeCookie('zh')).toBeUndefined()
    expect(normalizeCookie('desktop_promo_dismissed=1; auth=')).toBeUndefined()
  })

  it('normalizes whitespace and rejects empty input', () => {
    expect(normalizeCookie('  auth=Fe26.2*abc ;  oc_locale=zh  ')).toBe('auth=Fe26.2*abc; oc_locale=zh')
    expect(normalizeCookie('   ')).toBeUndefined()
    expect(normalizeCookie(undefined)).toBeUndefined()
  })
})

describe('loadConfig', () => {
  let savedEnv: Record<string, string | undefined>
  let tmp: string

  beforeEach(() => {
    savedEnv = clearEnv()
    tmp = mkdtempSync(join(tmpdir(), 'dsh-ocgo-usage-test-'))
    process.env.DSH_HOME = tmp
  })

  afterEach(() => {
    restoreEnv(savedEnv)
    rmSync(tmp, { recursive: true, force: true })
  })

  it('returns defaults when nothing is configured', () => {
    const cfg = loadConfig()
    expect(cfg.token).toBeUndefined()
    expect(cfg.apiKey).toBeUndefined()
    expect(cfg.cookie).toBeUndefined()
    expect(cfg.workspaceID).toBeUndefined()
    expect(cfg.baseUrl).toBe(DEFAULT_BASE_URL)
    expect(cfg.cacheTTL).toBe(DEFAULT_CACHE_TTL)
    expect(cfg.timeoutMs).toBe(DEFAULT_TIMEOUT_MS)
  })

  it('reads env vars: token, api key, legacy cookie and workspace', () => {
    process.env[ENV_TOKEN] = 'st_env-token'
    process.env[ENV_API_KEY] = 'sc-key-env'
    process.env[ENV_COOKIE] = 'Fe26.2*env'
    process.env[ENV_WORKSPACE_ID] = 'wrk_env'
    process.env[ENV_BASE_URL] = 'https://example.com'
    process.env[ENV_CACHE_TTL] = '120'
    process.env[ENV_TIMEOUT_MS] = '5000'
    const cfg = loadConfig()
    expect(cfg.token).toBe('st_env-token')
    expect(cfg.apiKey).toBe('sc-key-env')
    expect(cfg.cookie).toBe('auth=Fe26.2*env; oc_locale=en')
    expect(cfg.workspaceID).toBe('wrk_env')
    expect(cfg.baseUrl).toBe('https://example.com')
    expect(cfg.cacheTTL).toBe(120)
    expect(cfg.timeoutMs).toBe(5000)
  })

  it('env wins over the config file', () => {
    writeFileSync(join(tmp, 'ocgo-usage.json'), JSON.stringify({
      token: 'st_file-token',
      apiKey: 'sc-file-key',
      workspaceID: 'wrk_file',
      cacheTTL: 9999,
    }))
    process.env[ENV_TOKEN] = 'st_env-token'
    const cfg = loadConfig()
    expect(cfg.token).toBe('st_env-token')
    expect(cfg.apiKey).toBe('sc-file-key')
    expect(cfg.workspaceID).toBe('wrk_file')
  })

  it('falls back to the config file and clamps cacheTTL', () => {
    writeFileSync(join(tmp, 'ocgo-usage.json'), JSON.stringify({
      token: 'st_file-token',
      workspaceID: 'wrk_file',
      cacheTTL: 9999,
    }))
    const cfg = loadConfig()
    expect(cfg.token).toBe('st_file-token')
    expect(cfg.workspaceID).toBe('wrk_file')
    expect(cfg.cacheTTL).toBe(3600)
    expect(cfg.timeoutMs).toBe(DEFAULT_TIMEOUT_MS)
  })

  it('tolerates a broken config file', () => {
    writeFileSync(join(tmp, 'ocgo-usage.json'), '{not json')
    const cfg = loadConfig()
    expect(cfg.token).toBeUndefined()
    expect(cfg.baseUrl).toBe(DEFAULT_BASE_URL)
  })
})

describe('masked config view + write', () => {
  let savedEnv: Record<string, string | undefined>
  let tmp: string

  beforeEach(() => {
    savedEnv = clearEnv()
    tmp = mkdtempSync(join(tmpdir(), 'dsh-ocgo-usage-mask-'))
    process.env.DSH_HOME = tmp
  })

  afterEach(() => {
    restoreEnv(savedEnv)
    rmSync(tmp, { recursive: true, force: true })
  })

  it('masks the tail of a secret', () => {
    expect(maskSecret(undefined)).toEqual({ set: false, tail: '' })
    expect(maskSecret('abcd')).toEqual({ set: true, tail: 'abcd' })
    expect(maskSecret('st_long-token-xyz1')).toEqual({ set: true, tail: 'xyz1' })
  })

  it('exposes only masked values in the view', () => {
    const token = 'st_secret-token-9abc'
    const apiKey = 'sc_secret-key-wxyz'
    const ws = 'wrk_01XXXXXXXXXXXXXXXXXXXX8q2w'
    process.env[ENV_TOKEN] = token
    process.env[ENV_API_KEY] = apiKey
    process.env[ENV_WORKSPACE_ID] = ws
    const view = maskedConfigView()
    expect(view.token).toEqual({ set: true, tail: token.slice(-4) })
    expect(view.apiKey).toEqual({ set: true, tail: apiKey.slice(-4) })
    expect(view.workspaceID).toEqual({ set: true, tail: ws.slice(-4) })
    expect(JSON.stringify(view)).not.toContain('secret-token')
    expect(JSON.stringify(view)).not.toContain('secret-key')
  })

  it('writes new values to the config file', () => {
    const view = writeConfigFile({ token: 'st_new-token-1234', workspaceID: 'wrk_new' })
    expect(view.token).toEqual({ set: true, tail: 'st_new-token-1234'.slice(-4) })
    expect(view.apiKey).toEqual({ set: false, tail: '' })
    expect(view.workspaceID).toEqual({ set: true, tail: 'wrk_new'.slice(-4) })
    const cfg = loadConfig()
    expect(cfg.workspaceID).toBe('wrk_new')
    expect(cfg.token).toBe('st_new-token-1234')
  })

  it('preserves other fields and clears a field with null', () => {
    writeFileSync(join(tmp, 'ocgo-usage.json'), JSON.stringify({
      token: 'st_old-token',
      apiKey: 'sc_old-key',
      workspaceID: 'wrk_old',
      baseUrl: 'https://example.com',
      cacheTTL: 120,
    }))
    const view = writeConfigFile({ token: null, workspaceID: 'wrk_new2' })
    expect(view.token).toEqual({ set: false, tail: '' })
    expect(view.apiKey).toEqual({ set: true, tail: 'sc_old-key'.slice(-4) })
    expect(view.workspaceID).toEqual({ set: true, tail: 'wrk_new2'.slice(-4) })
    const raw = JSON.parse(readFileSync(join(tmp, 'ocgo-usage.json'), 'utf8'))
    expect(raw.baseUrl).toBe('https://example.com')
    expect(raw.cacheTTL).toBe(120)
    expect(raw.token).toBeUndefined()
    expect(raw.apiKey).toBe('sc_old-key')
  })

  it('keeps fields absent from the write untouched (no accidental clear)', () => {
    writeFileSync(join(tmp, 'ocgo-usage.json'), JSON.stringify({
      token: 'st_keepme',
      workspaceID: 'wrk_keep',
    }))
    // Only workspaceID is present in the partial; token must survive.
    const view = writeConfigFile({ workspaceID: 'wrk_new3' })
    expect(view.workspaceID).toEqual({ set: true, tail: 'wrk_new3'.slice(-4) })
    expect(view.token).toEqual({ set: true, tail: 'st_keepme'.slice(-4) })
    const raw = JSON.parse(readFileSync(join(tmp, 'ocgo-usage.json'), 'utf8'))
    expect(raw.token).toBe('st_keepme')
    expect(raw.workspaceID).toBe('wrk_new3')
  })
})