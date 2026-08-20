// Host half of dsh-bash-prefix.
//
// Exactly mirrors the proven dsh-model-sync pattern: the plugin's default
// export is a TypertRemoteService subclass, so loading the plugin registers
// the "bashPrefix" Cordis service (reachable by the Typert gateway) and the
// shell-wrap is installed from the constructor.
//
// Two jobs:
//  1. Expose "bashPrefix" get()/set() so the browser Settings UI can read/write
//     the persisted `settings.bash-prefix` document (the `editable` edit lock
//     and the `preamble` text). The namespace is REGISTERED at load time (DSH
//     requires it before any read/write), and we use the returned owner scope.
//  2. Wrap ctx.shell.resolve() so that, when the preamble is non-empty, it is
//     prepended to EVERY DSH bash command (foreground and background).

import z from "@deepseek-ai/schemastery";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";

export const Config = z.object({});

const NS = settingsNamespace("bash-prefix");
const DEFAULTS = { kind: "bash-prefix", editable: false, preamble: "" };

// Schemastery schema for the `settings.bash-prefix` document, so DSH can
// validate, persist and re-resolve it across reloads.
const StateSchema = z.object({
  editable: z.boolean().default(false),
  preamble: z.string().default(""),
});

export default class BashPrefixGateway extends TypertRemoteService {
  static inject = ["shell", "settings"];

  constructor(ctx) {
    super(ctx, "bashPrefix");
    // Register the namespace up front (idempotent if already registered) and
    // keep the owner scope. Reads/writes go through the scope.
    this.scope = BashPrefixGateway.ensureRegistered(ctx);
    this.settings = ctx.settings;
    this.installShellWrap(ctx);
  }

  /** Register the `bash-prefix` namespace and return its owner scope. */
  static ensureRegistered(ctx) {
    const settings = ctx.settings;
    if (typeof settings?.register !== "function") return undefined;
    try {
      // register() throws on duplicate; tolerate an existing registration.
      return settings.register(NS, StateSchema);
    } catch {
      // Already registered by another instance — fall back to direct reads.
      return undefined;
    }
  }

  /** Resolve the current editable lock + preamble. */
  readState() {
    let doc;
    if (this.scope) {
      try {
        doc = this.scope.get();
      } catch {
        doc = undefined;
      }
    } else {
      try {
        doc = this.settings?.get(NS);
      } catch {
        doc = undefined;
      }
    }
    return {
      editable: !!(doc && doc.editable),
      preamble: doc && typeof doc.preamble === "string" ? doc.preamble : "",
    };
  }

  /** Return the current editable lock + preamble. */
  get() {
    return { ...DEFAULTS, ...this.readState() };
  }

  /**
   * Persist a partial update, then return the new state.
   *
   * Fields the payload leaves `undefined` keep their current value. This is
   * what guarantees the preamble is never wiped: toggling the editable lock
   * sends `set({ editable })` (preamble untouched), and saving sends
   * `set({ preamble })` (preamble set to exactly what was typed — never
   * auto-cleared). The only way the preamble becomes empty is the user
   * actually deleting the text.
   */
  set(payload) {
    const cur = this.readState();
    const next = {
      ...DEFAULTS,
      ...cur,
      editable: payload && typeof payload.editable === "boolean" ? payload.editable : cur.editable,
      preamble: payload && typeof payload.preamble === "string" ? payload.preamble : cur.preamble,
    };
    try {
      if (this.scope) {
        this.scope.update({ editable: next.editable, preamble: next.preamble });
      } else if (this.settings) {
        this.settings.update(NS, { editable: next.editable, preamble: next.preamble });
      } else {
        throw new Error("settings service unavailable");
      }
    } catch (e) {
      next.error = String((e && e.message) || e);
    }
    return next;
  }

  /**
   * Wrap ctx.shell.resolve() so every bash command gets the preamble prepended
   * whenever the preamble is non-empty. resolve() returns the fully-resolved
   * spec whose .command is handed to `bash -c`, so this single seam covers
   * both foreground (run) and background (start) calls.
   *
   * Injecting depends ONLY on the preamble being non-empty — the editable lock
   * is purely a UI concern and never gates injection.
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
      const preamble = (state.preamble || "").trim();
      if (preamble.length === 0) return spec;
      // Newline-separated so an `export` in the preamble applies to the command.
      spec.command = `${preamble}\n${spec.command}`;
      return spec;
    };
  }
}
