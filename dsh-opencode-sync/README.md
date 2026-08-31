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
- OpenCode Go serves its models on **one endpoint with three wire protocols**: the OpenAI
  Responses API (GPT-5.6 Luna, Grok), OpenAI-compatible chat completions (GLM, Kimi,
  DeepSeek, …), and the Anthropic Messages API (MiniMax, Qwen). dsh-llm-pi-ai's settings
  schema has **no per-model `api` field** — a provider-level `api` pins every model onto a
  single protocol, which breaks everything that does not use that protocol.
- The only channel into per-model protocols is the installed pi-ai catalog
  (`providers/data/opencode-go.json`), which ships as a static snapshot and goes stale.
- This plugin rebuilds that catalog file from **official live data**, so every model keeps
  the protocol that actually works.

## Features

A **Model Sync** page is added to the `Settings → Models` sidebar:

- **Refresh** button on top — syncs both `opencode-go` and `zen` in a single operation
  (one settings write).
- **Per-card Sync buttons** — OpenCode Go and OpenCode Zen can be synced independently.

Sync behavior:

- **opencode-go — rebuilds the pi-ai catalog file** (the only per-model protocol channel):
  1. fetches the official model metadata from `https://models.opencode.ai/api.json` —
     capacities, modalities, reasoning flags — the same source opencode.ai's docs page and
     pi-ai's catalog are generated from;
  2. applies the authoritative per-model protocol table from
     [https://opencode.ai/docs/go#endpoints](https://opencode.ai/docs/go#endpoints)
     (`openai-responses` / `openai-completions` / `anthropic-messages`), overriding
     `api.json` where it omits annotations (e.g. the qwen messages group);
  3. writes the rebuilt 33-model catalog into every copy of pi-ai's
     `opencode-go.json` (the pnpm store that the runtime process reads, and the checkout
     copy the profile plugin resolves);
  4. keeps the `opencode-go` provider in settings **lean** — no `api`, `baseURL`, or
     `models` fields — so llm-pi-ai dispatches per model from the catalog. Pinning a
     route-level `api` would squash every model onto one wire protocol.
  New go models arrive with their correct protocol automatically.
- **zen**: `https://opencode.ai/zen/v1/models` is called **with your workspace API key**.
  That endpoint only returns the models you have **enabled** on [opencode.ai](https://opencode.ai)
  (the disabled list is filtered by key), so zen sync writes exactly your enabled subset —
  never the full catalog.
- **Capacity overwrite**: each model's `contextWindow` / `maxTokens` / `input` (text /
  image) is taken from the official catalog opencode itself uses
  (`~/.cache/opencode/models.json`, models.dev-backed). Models missing from that catalog
  (e.g. brand-new releases) keep their existing configured values, falling back to
  `262144 / 32768`, and are reported in the result so you know which ones to double-check.

### Why a catalog file, not settings `models`

`llm-pi-ai` resolves each model's wire protocol from the installed catalog
(`base?.api`); entries written into `providers.<route>.models` carry no `api` field, so a
live model id the catalog does not describe fails settings validation with
`needs an api`, and a route-level `api` overwrites every model. The catalog file is the
one place per-model `api`/`baseUrl` can live for all three protocols at once.

The catalog is imported once per dsh process, so a rebuild takes effect after a dsh
restart. The sync result reports exactly how many models were written and to which
paths.

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

Restart the dsh web service afterwards (the catalog rebuild and settings changes are
picked up on startup).

## Configuration (cordis)

Add an insert entry to your DSH profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: model-sync
      name: 'dsh-model-sync'
      config:
        goUrl: 'https://opencode.ai/zen/go/v1/models'
        zenUrl: 'https://opencode.ai/zen/v1/models'
        modelsApi: 'https://models.opencode.ai/api.json'
        cachePath: '~/.cache/opencode/models.json'
        timeoutMs: 15000
```

| Option       | Default                                        | Description                                         |
| ------------ | ---------------------------------------------- | --------------------------------------------------- |
| `goUrl`      | `https://opencode.ai/zen/go/v1/models`         | opencode-go model list endpoint                     |
| `zenUrl`     | `https://opencode.ai/zen/v1/models`            | zen model list endpoint (called with the API key)   |
| `modelsApi`  | `https://models.opencode.ai/api.json`          | official model metadata for catalog rebuild         |
| `cachePath`  | `~/.cache/opencode/models.json`                | local official catalog (models.dev snapshot)        |
| `timeoutMs`  | `15000`                                        | per-request timeout in milliseconds                 |

## Usage

1. Open DSH web → **Settings → Models**.
2. Make sure the `opencode-go` and `zen` providers already exist there — the plugin
   does not create providers from scratch (`apiKeyEnv` must already live on the provider).
3. Open the **Model Sync** page and click **Refresh** (or one of the per-provider
   **Sync** buttons). The Go card calls `syncGoCatalog()`: it rebuilds the pi-ai catalog
   file from the official data — the result shows `total` models written, the
   `byProtocol` split, and the file paths written.
4. **Restart dsh web** so the runtime process imports the rebuilt catalog (per-model
   protocols then dispatch correctly across all three wire protocols).

## Troubleshooting

- **zen skipped, "no usable workspace API key"** — configure one of
  `OPENCODE_WORKSPACE_API_KEY` / `OPENCODE_GO_API_KEY` / `ZEN_API_KEY`, or make sure
  opencode is logged in (`~/.local/share/opencode/auth.json`).
- **HTTP 401** — the workspace key is invalid or expired; refresh it at
  [opencode.ai](https://opencode.ai). Note the region guard: some models are only served
  from supported regions, and the gateway answers 403
  `[unsupported_country_region_territory]` for unsupported egress IPs.
- **`ERR_PNPM_UNEXPECTED_STORE` during install** — the pnpm store path of your DSH
  profile differs from the plugin's. Fallback: copy this directory into
  `profiles/web/node_modules/dsh-model-sync/` (the real directory in a hoisted layout)
  and add the `- id: model-sync` / `name: 'dsh-model-sync'` insert entry to
  `cordis.patch.yml` by hand.
- **settings write rejected, "needs an api"** — a stale `models` list on the
  `opencode-go` provider contains ids the installed catalog does not describe. Remove the
  provider's `models` (and `api` / `baseURL`) so the route stays lean and the catalog
  dispatches protocols.
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