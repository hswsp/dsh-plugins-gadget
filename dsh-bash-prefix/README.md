# dsh-bash-prefix

> **DeepSeek Harness plugin** — every time DSH opens a new bash (shell) session, it first
> runs a set of **pre-scripted commands (a rule list)** you define, then the command you
> actually asked for.
>
> A typical use: put the standard proxy `export`s in the list, so that **when your VPN is
> in **rule** mode, every DSH bash command automatically goes through the VPN**.

This repository hosts the plugin (package name `dsh-bash-prefix`).

[简体中文版说明 →](README.zh.md)

---

## What it does (in one paragraph)

DSH runs every bash command as `bash -c <command>` in a brand-new, non-interactive shell
that does **not** read `~/.zshrc`. That means proxy environment variables you set in your
shell profile simply never reach DSH's bash — so out-of-the-box, DSH bash commands are
**not** proxied, even if your system/VPN is running.

This plugin fixes that: it lets you keep a small **list of pre-scripted commands**, and
when the toggle is **Enable**, it prepends that whole list to **every** bash call. So the
very first thing each new bash session runs is your rule list — typically:

```bash
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7897
```

Because those `export`s execute before the real command, every subsequent command in that
bash session sees the proxy variables and routes through the VPN (e.g. Clash in **rule**
mode), without you typing them by hand again.

## Features

Adds a **Bash 预处理** (Bash Preamble) page to `Settings`:

- **Enable / Disable pill toggle** — turn the rule injection on or off.
  - **Enable** — the rule list is prepended to every bash call.
  - **Disable** — bash runs exactly as-is, nothing injected.
- **Rule list, one command per line** — add a command with the **Add** button (or press
  Enter in the input), remove any row with its **×** button. Each row is one line that runs
  before every bash call.
- **No Save button** — every add/remove/toggle persists immediately.
- **Persisted** across restarts; covers **both foreground and background** bash calls.

Example rule list (one line per command):

```
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7897
```

## How it works

DSH's bash tool resolves every command through `ctx.shell.resolve()` and passes the
resulting spec's `.command` to `bash -c`. This plugin wraps that **single seam**:
when the toggle is **Enable** and the rule list is non-empty, the joined rules are prepended
to `spec.command` (newline-separated, so an `export` in a rule applies to the commands that
follow). Only the command string is touched — never argv, sandbox, or argument parsing — so
escalation and background semantics are preserved.

When the toggle is **Disable** (or the rule list is empty), bash runs exactly as-is.

## Compatibility

Requires DSH ≥ `0.1.5-rc.1`. `@deepseek-ai/dsh-settings@0.1.5` removed the
`settingsNamespace()` helper — settings namespaces are plain strings now. This plugin
registers/reads the `"bash-prefix"` namespace with plain strings; older `dsh-settings`
(`^0.1.0-rc.6`) accepted plain strings too, so the plugin works on both.

Works on **dsh CLI** and **DSH Desktop** from this single codebase — see the
[repository README](../README.md#同时支持-dsh-cli-与-dsh-desktop) for why.

## Install

```bash
# dsh CLI, into a profile
dsh plugin --profile web add /path/to/dsh-plugins-gadget/dsh-bash-prefix
```

Then restart the dsh process. The package declares
`dsh.bundle.patch` → `./cordis.patch.yml`, so the host loads it as a **profile
bundle**: its loader entry is registered by the bundle's own patch layer and the
package must also be listed in the profile's `dsh.profile.bundles`.

**DSH Desktop** manages plugins through its market (dshmarket); a directory-form
plugin installs through Desktop's bundled generation installer, and Desktop's
projection then links it into the profile automatically.

## Configuration (cordis)

**Nothing to add by hand.** The bundle patch ships inside the package and
registers the loader entry itself:

```yaml
# cordis.patch.yml, inside this package
- insert:
    - id: bash-prefix
      name: dsh-bash-prefix
```

Adding the same `id` to the profile's own `cordis.patch.yml` as well would fail
profile boot with `duplicate loader entry id: bash-prefix`.

No extra plugin config is required — the toggle state and rule list live in the
`settings.bash-prefix` namespace and are edited from the Settings UI.

## Usage

1. Open DSH web → **Settings → Bash 预处理**.
2. Leave the toggle each way you want — **Enable** to inject, **Disable** to stop.
3. Under the rule list, type a command into the input and click **Add** (or press Enter).
   Repeat for every line you want to run before each bash call.
4. The rules are saved immediately — there is no separate Save button.
5. From now on, every DSH bash command first runs those lines, then the command itself.

## Troubleshooting

- **`ERR_PNPM_UNEXPECTED_STORE` during install** — your DSH profile's pnpm store path
  differs from the plugin's. Fallback: copy this directory into
  `profiles/web/node_modules/dsh-bash-prefix/` (the real directory in a hoisted layout) and
  add the `- id: bash-prefix` / `name: 'dsh-bash-prefix'` insert entry to `cordis.patch.yml`
  by hand.
- **No "Bash 预处理" entry in Settings after installing** — reload / restart the dsh web
  service so the client bundle is picked up.
- **Host changes (index.js) not taking effect** — the host half loads only at startup;
  restart the dsh web process after editing `index.js` (the browser `client.js` just needs a
  page refresh).
- **Rules seem not to run** — make sure the toggle is **Enable** and at least one rule is
  present; check `settings.bash-prefix` in your profile's settings file.
- **VPN still not applied** — the plugin only injects the proxy `export`s into the bash
  environment. The proxy app itself (e.g. Clash) must be running and in **rule** mode with
  an available upstream node, and `127.0.0.1:7897` must match the proxy's actual port.

## Project layout

| File             | Role                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| `index.js`       | Host half: `BashPrefixGateway` service (a Typert Remote) + shell wrap  |
| `client.js`      | Browser half: settings sidebar section + Enable/Disable & rule list    |
| `typert.host.js` | Typert host manifest (strict-mode dispatch of the `bashPrefix` Remote) |
| `cordis.patch.yml` | Bundle patch: registers the `bash-prefix` loader entry              |
| `package.json`   | Package metadata + `dsh.bundle` / `dsh.client` declarations            |

## License

MIT — see [LICENSE](LICENSE).
