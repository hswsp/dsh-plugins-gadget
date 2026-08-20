# dsh-model-sync

> **DeepSeek Harness plugin** — one-click sync of the **OpenCode Go** and **OpenCode Zen**
> model lists into DSH **Settings → Models**, so you never have to copy model IDs from
> the opencode.ai website by hand again.

This repository hosts the plugin (package name `dsh-model-sync`) and is published as
`hswsp/dsh-opencode-sync`.

[简体中文版说明 →](README.zh.md)

---

## Why

- **opencode-go** and **OpenCode Zen** (your OpenCode subscription plans) add, rename, and
  retire models frequently.
- Keeping `Settings → Models` in DeepSeek Harness in sync used to mean manually diffing the
  catalog on opencode.ai against your local model list.
- This plugin does it in one click, right inside the DSH web settings UI.

## Features

A **Model Sync** page is added to the `Settings → Models` sidebar:

- **Refresh** button on top — syncs both `opencode-go` and `zen` in a single operation
  (one settings write).
- **Per-card Sync buttons** — OpenCode Go and OpenCode Zen can be synced independently.

Sync behavior:

- **opencode-go**: the live list from `https://opencode.ai/zen/go/v1/models` **fully
  replaces** `llm-pi-ai.providers["opencode-go"].models` — new models are added, delisted
  ones are removed.
- **zen**: `https://opencode.ai/zen/v1/models` is called **with your workspace API key**.
  That endpoint only returns the models you have **enabled** on [opencode.ai](https://opencode.ai)
  (the disabled list is filtered by key), so zen sync writes exactly your enabled subset —
  never the full catalog.
- **Capacity overwrite**: each model's `contextWindow` / `maxTokens` / `input` (text /
  image) is taken from the official catalog opencode itself uses
  (`~/.cache/opencode/models.json`, models.dev-backed). Models missing from that catalog
  (e.g. brand-new releases) keep their existing configured values, falling back to
  `262144 / 32768`, and are reported in the result so you know which ones to double-check.

## API keys

- **opencode-go**: no key required.
- **zen**: a workspace API key is required. It is resolved in this priority order:
  1. DSH credentials / environment variable `OPENCODE_WORKSPACE_API_KEY`
  2. `OPENCODE_GO_API_KEY` (the Go subscription key is itself a workspace key)
  3. `ZEN_API_KEY`
  4. The `type=api` key for `opencode-go` (fallback `opencode`) in
     `~/.local/share/opencode/auth.json`

Without a usable key the zen sync is **skipped** with a hint. Without the key the endpoint
returns *every* model, so syncing would silently wipe your enabled selection.

## Installation

```bash
# from this repository
dsh plugin --profile web add /path/to/dsh-opencode-sync

# or, while developing inside the DeepSeek Harness source tree
dsh plugin --profile web add ../../../plugins/dsh-model-sync
```

Restart the dsh web service afterwards (the web profile hot-reloads `cordis.patch.yml`,
so in most cases no restart is needed).

## Configuration (cordis)

Add an insert entry to your DSH profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: model-sync
      name: 'dsh-model-sync'
      config:
        goUrl: 'https://opencode.ai/zen/go/v1/models'
        zenUrl: 'https://opencode.ai/zen/v1/models'
        cachePath: '~/.cache/opencode/models.json'
        timeoutMs: 15000
```

| Option      | Default                                     | Description                                          |
| ----------- | ------------------------------------------- | ---------------------------------------------------- |
| `goUrl`     | `https://opencode.ai/zen/go/v1/models`      | opencode-go model list endpoint                      |
| `zenUrl`    | `https://opencode.ai/zen/v1/models`         | zen model list endpoint (called with the API key)    |
| `cachePath` | `~/.cache/opencode/models.json`             | local official catalog (models.dev snapshot)         |
| `timeoutMs` | `15000`                                     | per-request timeout in milliseconds                  |

## Usage

1. Open DSH web → **Settings → Models**.
2. Make sure the `opencode-go` and `zen` providers already exist there — the plugin syncs
   their model lists but does not create the providers (their `api` / `baseURL` /
   `apiKeyEnv` live on the provider, and a provider with only `models` would fail
   validation).
3. Open the **Model Sync** page and click **Refresh** (or one of the per-provider
   **Sync** buttons).
4. Each card reports `total` / `added` / `removed` and lists any models whose capacity
   fell back to defaults.

## Troubleshooting

- **zen skipped, "no usable workspace API key"** — configure one of
  `OPENCODE_WORKSPACE_API_KEY` / `OPENCODE_GO_API_KEY` / `ZEN_API_KEY`, or make sure
  opencode is logged in (`~/.local/share/opencode/auth.json`).
- **HTTP 401** — the workspace key is invalid or expired; refresh it at
  [opencode.ai](https://opencode.ai).
- **`ERR_PNPM_UNEXPECTED_STORE` during install** — the pnpm store path of your DSH
  profile differs from the plugin's. Fallback: copy this directory into
  `profiles/web/node_modules/dsh-model-sync/` (the real directory in a hoisted layout)
  and add the `- id: model-sync` / `name: 'dsh-model-sync'` insert entry to
  `cordis.patch.yml` by hand.
- **capacities reported as fallback** — the local catalog
  (`~/.cache/opencode/models.json`) is stale or absent; run opencode once so it refreshes
  the cache, or check the model manually.

## Project layout

| File             | Role                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| `index.js`       | Host half: `ModelSyncGateway` service (a Typert Remote), sync logic  |
| `client.js`      | Browser half: settings sidebar section + React sync panel            |
| `typert.host.js` | Typert host manifest (strict-mode dispatch of the `modelSync` Remote)|
| `package.json`   | Package metadata + DSH client inject manifest                        |

## License

MIT — see [LICENSE](LICENSE).
