// Host half of dsh-bash-prefix.
//
// Exactly mirrors the proven dsh-model-sync pattern: the plugin's default
// export is a TypertRemoteService subclass, so loading the plugin registers
// the "bashPrefix" Cordis service (reachable by the Typert gateway) and the
// shell-wrap is installed from the constructor.
//
// Two jobs:
//  1. Expose "bashPrefix" get()/set() so the browser Settings UI can read/write
//     the persisted `settings.bash-prefix` document: a master `enabled` toggle
//     plus a `rules` list of preamble commands (one command per line). The
//     namespace is REGISTERED at load time and reads/writes use the owner scope.
//  2. Wrap ctx.shell.resolve() so that, when enabled and the rules are
//     non-empty, the joined rules are prepended to EVERY DSH bash command
//     (foreground and background).

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
      return undefined;
    }
  }

  /** Resolve the current toggle + rules from the live settings service. */
  readState() {
    let doc;
    try {
      doc = this.settings?.get(NS);
    } catch {
      doc = undefined;
    }
    const rules = doc && Array.isArray(doc.rules) ? doc.rules.filter((r) => typeof r === "string") : [];
    return {
      enabled: !!(doc && doc.enabled),
      rules,
    };
  }

  /** Return the current toggle + rules. */
  get() {
    return { ...DEFAULTS, ...this.readState() };
  }

  /**
   * Persist a partial update, then return the new state.
   *
   * Fields the payload leaves `undefined` keep their current value. Flipping
   * the toggle sends `set({ enabled })` (rules untouched); adding/removing a
   * rule sends `set({ rules })` (a list replace, one line per command). Both
   * are independent and never wipe the other.
   */
  async set(payload) {
    const cur = this.readState();
    const next = {
      ...DEFAULTS,
      ...cur,
      enabled: payload && typeof payload.enabled === "boolean" ? payload.enabled : cur.enabled,
      rules: payload && Array.isArray(payload.rules) ? payload.rules.filter((r) => typeof r === "string") : cur.rules,
    };
    try {
      if (this.scope) {
        await this.scope.update({ enabled: next.enabled, rules: next.rules });
      } else if (this.settings) {
        await this.settings.update(NS, { enabled: next.enabled, rules: next.rules });
      } else {
        throw new Error("settings service unavailable");
      }
      // Re-read the persisted state so the returned value reflects storage
      // (schema defaults/validation applied), never a stale in-memory copy.
      return { ...DEFAULTS, ...this.readState() };
    } catch (e) {
      next.error = String((e && e.message) || e);
      return next;
    }
  }

  /**
   * Wrap ctx.shell.resolve() so every bash command gets the joined rules
   * prepended when the toggle is on AND the rules are non-empty. resolve()
   * returns the fully-resolved spec whose .command is handed to `bash -c`,
   * covering both foreground (run) and background (start) calls.
   */
  installShellWrap(ctx) {
    const shell = ctx.shell;
    if (!shell || typeof shell.resolve !== "function") return;

    const originalResolve = shell.resolve.bind(shell);
    const self = this;
    shell.resolve = (request) => {
      const spec = originalResolve(request);
      if (!spec || typeof spec.command !== "string") return spec;
      const state = self.readState();
      const rules = state.rules || [];
      const preamble = rules.filter((r) => r.trim() !== "").join("\n");
      if (!state.enabled || preamble.length === 0) return spec;
      // Newline-separated so an `export` in a rule applies to the command.
      spec.command = `${preamble}\n${spec.command}`;
      return spec;
    };
  }
}
