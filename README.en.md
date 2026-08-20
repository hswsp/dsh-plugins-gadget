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

## Installing a plugin

Take `dsh-opencode-sync` as an example — enter its directory and follow that plugin's README:

```bash
# e.g. install dsh-opencode-sync
cd dsh-opencode-sync
dsh plugin --profile web add /path/to/dsh-plugins-gadget/dsh-opencode-sync
```

See each plugin subdirectory's README for full installation and configuration details.

## Directory layout

```
dsh-plugins-gadget/
├── README.md            # this doc (Chinese)
├── README.en.md         # this doc (English)
├── .gitignore
└── <plugin-a>/          # one subdirectory per plugin
    ├── package.json
    ├── index.js
    ├── client.js
    └── README.md / README.xx.md
```

## License

All plugins in this repository are open-sourced under the **MIT** license — see each
plugin directory's `LICENSE`.
