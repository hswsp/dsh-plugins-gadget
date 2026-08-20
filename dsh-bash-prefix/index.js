// Host half of dsh-bash-prefix.
//
// Exactly mirrors the proven dsh-model-sync pattern: the plugin's default
// export is a TypertRemoteService subclass, so loading the plugin registers
// the "bashPrefix" Cordis service (reachable by the Typert gateway) and the
// shell-wrap is installed from the constructor.
//
// Two jobs:
//  1. Expose "bashPrefix" get()/set() so the browser Settings UI can read/write
//     the persisted toggle + preamble living in the `settings.bash-prefix`
//     namespace.
//  2. Wrap ctx.shell.resolve() so that, when the toggle is on, the preamble is
//     prepended to EVERY DSH bash command (foreground and background).

import z from "@deepseek-ai/schemastery";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";

export const Config = z.object({});

const DEFAULTS = { kind: "bash-prefix", enabled: false, preamble: "" };

function readState(ctx) {
  let doc;
  try {
    doc = ctx.settings.get(settingsNamespace("bash-prefix"));
  } catch {
    doc = undefined;
  }
  return {
    enabled: !!(doc && doc.enabled),
    preamble: doc && typeof doc.preamble === "string" ? doc.preamble : "",
  };
}

export default class BashPrefixGateway extends TypertRemoteService {
  static inject = ["shell", "settings"];

  constructor(ctx) {
    super(ctx, "bashPrefix");
    this.installShellWrap(ctx);
  }

  /** Return the current toggle + preamble. */
  get() {
    return { ...DEFAULTS, ...readState(this.ctx) };
  }

  /** Persist toggle + preamble, then return the new state. */
  set(payload) {
    const next = {
      ...DEFAULTS,
      ...readState(this.ctx),
      enabled: !!(payload && payload.enabled),
      preamble: payload && typeof payload.preamble === "string" ? payload.preamble : "",
    };
    try {
      this.ctx.settings.update(settingsNamespace("bash-prefix"), {
        enabled: next.enabled,
        preamble: next.preamble,
      });
    } catch (e) {
      next.error = String((e && e.message) || e);
    }
    return next;
  }

  /**
   * Wrap ctx.shell.resolve() so every bash command gets the preamble prepended
   * when the toggle is on. resolve() returns the fully-resolved spec whose
   * .command is handed to `bash -c`, so this single seam covers both
   * foreground (run) and background (start) calls.
   */
  installShellWrap(ctx) {
    const shell = ctx.shell;
    if (!shell || typeof shell.resolve !== "function") return;

    const originalResolve = shell.resolve.bind(shell);
    shell.resolve = (request) => {
      const spec = originalResolve(request);
      if (!spec || typeof spec.command !== "string") return spec;
      let state;
      try {
        state = readState(ctx);
      } catch {
        state = { enabled: false, preamble: "" };
      }
      const preamble = (state.preamble || "").trim();
      if (!state.enabled || preamble.length === 0) return spec;
      // Newline-separated so an `export` in the preamble applies to the command.
      spec.command = `${preamble}\n${spec.command}`;
      return spec;
    };
  }
}
