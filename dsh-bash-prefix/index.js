// Host half of dsh-bash-prefix.
//
// The plugin's default export is a TypertRemoteService subclass, so loading it
// registers the "bashPrefix" Cordis service (reachable through the Typert
// gateway) and installs the shell wrap from the constructor.
//
// Two jobs:
//  1. Expose "bashPrefix" get()/set() so the browser Settings UI can read and
//     write the persisted `settings.bash-prefix` document: a master `enabled`
//     toggle plus a `rules` list of preamble commands (one command per line).
//     The namespace is registered at load time; reads and writes use the owner
//     scope.
//  2. Wrap ctx.shell.resolve() so that, when enabled and the rules are
//     non-empty, the joined rules are prepended to every DSH bash command
//     (foreground and background).
//
// This file is host-agnostic on purpose: the dsh CLI and DSH Desktop ship the
// same shell, settings and typert contracts, so one implementation serves both.
// What each host needs from the package is declared in package.json
// (`dsh.bundle.patch`, `dsh.client`) and cordis.patch.yml — never here.

import z from "@deepseek-ai/schemastery";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";

export const Config = z.object({});

const NS = "bash-prefix";
const DEFAULTS = { kind: "bash-prefix", enabled: false, rules: [] };

// Schemastery schema for the `settings.bash-prefix` document.
const StateSchema = z.object({
  enabled: z.boolean().default(false),
  rules: z.array(z.string()).default([]),
});

/** Keep only usable rule lines: strings, trimmed, blanks dropped. */
function normalizeRules(value) {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((rule) => typeof rule === "string")
    .map((rule) => rule.trim())
    .filter((rule) => rule.length > 0);
}

export default class BashPrefixGateway extends TypertRemoteService {
  static inject = ["shell", "settings"];

  constructor(ctx) {
    super(ctx, "bashPrefix");
    this.scope = BashPrefixGateway.ensureRegistered(ctx);
    this.settings = ctx.settings;
    this.installShellWrap(ctx);
  }

  /** Register the `bash-prefix` namespace and return its owner scope. */
  static ensureRegistered(ctx) {
    const settings = ctx.settings;
    if (typeof settings?.register !== "function") return undefined;
    try {
      return settings.register(NS, StateSchema);
    } catch {
      // Already registered (reload, or a second load in the same process):
      // fall back to the bare service, which still reads and writes the
      // namespace through settings.get/update below.
      return undefined;
    }
  }

  /** Resolve the current toggle and rules from the live settings service. */
  readState() {
    let doc;
    try {
      doc = this.settings?.get(NS);
    } catch {
      doc = undefined;
    }
    const rules = doc && Array.isArray(doc.rules) ? doc.rules.filter((rule) => typeof rule === "string") : [];
    return {
      enabled: !!(doc && doc.enabled),
      rules,
    };
  }

  /** Return the current toggle and rules. */
  get() {
    return { ...DEFAULTS, ...this.readState() };
  }

  /**
   * Persist a partial update, then return the new state.
   *
   * Fields the payload leaves undefined keep their current value. Flipping the
   * toggle sends `set({ enabled })` (rules untouched); editing the list sends
   * `set({ rules })`. Both are independent and never wipe the other.
   */
  async set(payload) {
    const current = this.readState();
    const next = {
      ...DEFAULTS,
      ...current,
      enabled: payload && typeof payload.enabled === "boolean" ? payload.enabled : current.enabled,
      rules: normalizeRules(payload?.rules) ?? current.rules,
    };
    try {
      const patch = { enabled: next.enabled, rules: next.rules };
      if (this.scope) {
        await this.scope.update(patch);
      } else if (this.settings) {
        await this.settings.update(NS, patch);
      } else {
        throw new Error("settings service unavailable");
      }
      // Re-read the persisted state so the result reflects storage (schema
      // defaults and validation applied), never a stale in-memory copy.
      return { ...DEFAULTS, ...this.readState() };
    } catch (error) {
      next.error = String(error?.message || error);
      return next;
    }
  }

  /**
   * Wrap ctx.shell.resolve() so every bash command gets the joined rules
   * prepended when the toggle is on and the rules are non-empty. resolve()
   * returns the fully-resolved spec whose .command is handed to `bash -c`,
   * covering both foreground (run) and background (start) calls.
   */
  installShellWrap(ctx) {
    const shell = ctx.shell;
    if (!shell || typeof shell.resolve !== "function") return;

    const originalResolve = shell.resolve.bind(shell);
    shell.resolve = (request) => {
      const spec = originalResolve(request);
      if (!spec || typeof spec.command !== "string") return spec;
      const state = this.readState();
      const preamble = (state.rules || []).filter((rule) => rule.trim() !== "").join("\n");
      if (!state.enabled || preamble.length === 0) return spec;
      // Newline-separated so an `export` in a rule applies to the command.
      spec.command = `${preamble}\n${spec.command}`;
      return spec;
    };
  }
}
