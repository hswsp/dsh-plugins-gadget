# dsh-bash-prefix

> **DeepSeek Harness plugin** — a toggle **on/off** plus a free-form **preamble textbox**.
> When on, **every DSH bash command first runs the commands you typed**, then the command
> itself. Ideal for turning on a VPN/proxy before each bash call.

This repository hosts the plugin (package name `dsh-bash-prefix`).

[简体中文版说明 →](README.zh.md)

---

## Why

- DSH's bash tool launches every command as `bash -c <command>` in a **fresh,
  non-interactive shell**, which does **not** read `~/.zshrc` and only inherits the host
  process environment. So proxy env vars set in your shell profile simply never reach DSH
  bash commands.
- Manually prefixing `export https_proxy=...` to every command is tedious and error-prone.
- This plugin moves that preamble into a **single Settings textbox** you control, and lets
  you **turn it on/off** with one switch.

## Features

Adds a **Bash 预处理** (Bash Preamble) page to DSH Settings:

- **Master toggle** — enable or disable the preamble entirely.
- **Free-form textarea** — type any commands (multiple lines) you want run before every
  bash call, e.g.:

  ```bash
  export https_proxy=http://127.0.0.1:7897
  export http_proxy=http://127.0.0.1:7897
  export all_proxy=socks5://127.0.0.1:7897
  ```

- **Persisted** across restarts, saved with one click.
- Covers **both foreground and background** bash calls.

## How it works

DSH's bash tool resolves every command through `ctx.shell.resolve()` and passes the
resulting spec's `.command` to `bash -c`. This plugin wraps that single seam
(`ctx.shell.resolve()`): when the toggle is on, the preamble is prepended to the command
(newline-separated, so an `export` in the preamble applies to the command). This touches
only the command string — never argv, sandbox, or argument parsing — so escalation and
background semantics are preserved.

When the toggle is **off** (or the preamble is empty), bash runs exactly as-is; nothing is
injected.

## Installation

```bash
# from this repository
dsh plugin --profile web add /path/to/dsh-plugins-gadget/dsh-bash-prefix

# or, inside the DeepSeek Harness source tree while developing
dsh plugin --profile web add ../../../plugins/dsh-bash-prefix
```

Restart the dsh web service afterwards (the web profile hot-reloads `cordis.patch.yml`,
so in most cases no restart is needed).

## Configuration (cordis)

Add an insert entry to your DSH profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: bash-prefix
      name: 'dsh-bash-prefix'
```

No extra plugin config is required — the toggle and preamble live in the
`settings.bash-prefix` namespace and are edited from the Settings UI.

## Usage

1. Open DSH web → **Settings → Bash 预处理**.
2. Flip the **master toggle** on.
3. Paste your preamble commands into the textarea (the proxy `export`s above are shown as
   a placeholder).
4. Click **Save**.
5. From now on, every DSH bash command first runs those commands, then the command itself.
   Toggle it off any time to stop injecting entirely.

## Troubleshooting

- **`ERR_PNPM_UNEXPECTED_STORE` during install** — the pnpm store path of your DSH profile
  differs from the plugin's. Fallback: copy this directory into
  `profiles/web/node_modules/dsh-bash-prefix/` (the real directory in a hoisted layout) and
  add the `- id: bash-prefix` / `name: 'dsh-bash-prefix'` insert entry to `cordis.patch.yml`
  by hand.
- **No "Bash 预处理" entry in Settings after enabling** — reload / restart the dsh web
  service so the client bundle is picked up.
- **Preamble seems not to run** — make sure the toggle is on and the textarea is non-empty;
  check `settings.bash-prefix` in your profile's settings file.

## Project layout

| File             | Role                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| `index.js`       | Host half: `BashPrefixGateway` service (a Typert Remote) + shell wrap |
| `client.js`      | Browser half: settings sidebar section + toggle/textarea panel         |
| `typert.host.js` | Typert host manifest (strict-mode dispatch of the `bashPrefix` Remote) |
| `package.json`   | Package metadata + DSH client inject manifest                          |

## License

MIT — see [LICENSE](LICENSE).
