# dsh-plugins-gadget

> **A collection of self-made DeepSeek Harness (DSH) plugins** — various plugins I build
> for my own DSH usage, each in its own subdirectory and installable independently.

This repository is a collection of DSH plugins that grows with my own needs. Each plugin
directory is a complete, independently publishable DSH plugin package (with its own
`package.json` and README).

[简体中文说明 →](README.md)

---

## Included plugins

| Directory            | Plugin name   | Description                                                   |
| -------------------- | ------------- | ------------------------------------------------------------- |
| [`dsh-opencode-sync/`](dsh-opencode-sync/) | `dsh-model-sync` | One-click sync of the OpenCode Go and OpenCode Zen model lists into Settings → Models |
| [`dsh-bash-prefix/`](dsh-bash-prefix/) | `dsh-bash-prefix` | Run your own preamble commands before every bash call (toggle + textbox), e.g. one-click VPN proxy |

> More plugins coming soon.

## Runs on both the dsh CLI and DSH Desktop

Every plugin here is **one codebase that runs on both hosts**:

| Host | Notes |
| ---- | ----- |
| **dsh CLI** | The command-line Harness (`dsh web` / `dsh --profile web`) |
| **DSH Desktop** | The packaged Electron app, whose plugins are managed by its built-in market |

One codebase is possible because both hosts expose the **same runtime contract** — the
same `schemastery` / `typert` / `settings` / `credentials` / `shell` services, and the
same bundle loading rules (the profile contract in
[`dsh-app-boot`](https://www.npmjs.com/package/@deepseek-ai/dsh-app-boot): any package
whose manifest declares `dsh.bundle.patch` is loaded as a bundle).

So a plugin needs **neither** a per-platform copy **nor** runtime branching. The only
requirement is declaring the packaging metadata both hosts look for:

```jsonc
{
  "dsh": {
    // (1) Declare this package a profile bundle and point at its patch layer.
    //     Without it the package can only be registered by a hand-written
    //     profile insert — Desktop's plugin migration and market both skip it.
    "bundle": { "patch": "./cordis.patch.yml" },
    // (2) The browser half (Settings UI), loaded by the host as a web app.
    "client": { "inject": ["..."], "platform": "web" },
    // (3) Harness releases verified compatible, for host-side checks.
    "compatibility": { "dshReleases": { "0.1.5-rc.1": "compatible" } }
  }
}
```

`cordis.patch.yml` is the concrete form of that declaration (a list of loader entries):

```yaml
- insert:
    - id: <entry-id>
      name: <package-name>
```

**The plugin code itself contains no host detection** — it never reads `DSH_HOME` to
guess an install layout and never probes the runtime. Every platform difference lives
in those two declaration files.

## Installing a plugin

```bash
# dsh CLI: install into a profile
dsh plugin --profile web add /path/to/dsh-plugins-gadget/dsh-opencode-sync
dsh plugin --profile web add /path/to/dsh-plugins-gadget/dsh-bash-prefix
```

**DSH Desktop** manages plugins through its market (dshmarket). A directory-form plugin
installs through Desktop's bundled generation installer:

```bash
# Provided by Desktop's market-installer:
#   POST /dsh-desktop/market-installer/install
# or install from the market UI under Settings → Plugins.
```

Restart Harness afterwards (the host half loads at process startup).

## Directory layout

```
dsh-plugins-gadget/
├── README.md            # this doc (Chinese)
├── README.en.md         # this doc (English)
├── .gitignore
└── <plugin-a>/          # one subdirectory per plugin
    ├── package.json         # declares dsh.bundle / dsh.client
    ├── cordis.patch.yml     # bundle patch layer (loader entries)
    ├── index.js             # host half (Cordis plugin)
    ├── client.js            # client half (Settings UI)
    ├── typert.host.js       # Typert Remote contract
    └── README.md / README.xx.md
```

## License

All plugins in this repository are open-sourced under the **MIT** license — see each
plugin directory's `LICENSE`.
