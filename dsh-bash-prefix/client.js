// Client half of dsh-bash-prefix: a Settings panel ("设置 → Bash 预处理")
// with a square labeled on/off toggle button and a rule list — type one
// command line, press Add (or Enter), and it appends to the list. Each rule
// row can be removed. No Save button: Add/remove/toggle persist immediately.
//
// The Host prepends the joined rules to every bash command when the toggle is
// on AND the rule list is non-empty (see index.js).
//
// Persistence goes through the "bashPrefix" Typert Remote (get/set).

window.__ModuleLoader__.load({
  id: "dsh-bash-prefix",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");

    const NS = "settings.bashPrefix";
    const inject = ["slots", "locale", "remote"];

    const zh = {
      nav: "Bash 预处理",
      title: "Bash 预处理（VPN / 代理）",
      hint: "开启后，每次 DSH 执行 bash 命令会先逐行执行下面的命令，再执行本次命令本身。常用于每次 bash 前设置代理环境变量。",
      toggleLabel: "启用 Bash 预处理",
      toggleOn: "Enable",
      toggleOff: "Disable",
      toggleOnDesc: "每次 bash 前都会先执行下面的命令",
      toggleOffDesc: "关闭后不会注入任何前缀",
      rulesLabel: "前置命令（一行一条）",
      rulesPlaceholder: "export https_proxy=http://127.0.0.1:7897",
      inputPlaceholder: "输入一条命令，例如 export https_proxy=http://127.0.0.1:7897",
      add: "添加",
      empty: "还没有命令，先在上面输入一条再点「添加」。",
      remove: "删除",
      error: "保存失败：{msg}",
    };
    const en = {
      nav: "Bash Preamble",
      title: "Bash preamble (VPN / proxy)",
      hint: "When enabled, every DSH bash command first runs the commands below line-by-line, then the command itself. Commonly used to export proxy env vars before each bash.",
      toggleLabel: "Enable bash preamble",
      toggleOn: "Enable",
      toggleOff: "Disable",
      toggleOnDesc: "The commands below run before every bash call",
      toggleOffDesc: "Off: nothing is injected",
      rulesLabel: "Preamble commands (one per line)",
      rulesPlaceholder: "export https_proxy=http://127.0.0.1:7897",
      inputPlaceholder: "Type a command, e.g. export https_proxy=http://127.0.0.1:7897",
      add: "Add",
      empty: "No commands yet — type one above and click Add.",
      remove: "Remove",
      error: "Save failed: {msg}",
    };

    const TYPERT_REMOTE = {
      package: "dsh-bash-prefix",
      descriptors: [
        {
          id: "dsh-bash-prefix#bashPrefix/get",
          service: "bashPrefix",
          namespace: "bashPrefix",
          method: "get",
          invocation: { kind: "direct" },
          parameters: [],
          result: {
            mode: "strict",
            typeSymbol: "dsh-bash-prefix#BashPrefixState",
            schema: { parse(value) { return value; } },
            create: () => ({ parse(value) { return value; } }),
          },
        },
        {
          id: "dsh-bash-prefix#bashPrefix/set",
          service: "bashPrefix",
          namespace: "bashPrefix",
          method: "set",
          invocation: { kind: "direct" },
          parameters: [{
            name: "payload",
            wire: "payload",
            source: "json",
            codec: { mode: "strict", typeSymbol: "dsh-bash-prefix#BashPrefixPayload", schema: { parse(value) { return value; } }, create: () => ({ parse(value) { return value; } }) },
          }],
          result: {
            mode: "strict",
            typeSymbol: "dsh-bash-prefix#BashPrefixState",
            schema: { parse(value) { return value; } },
            create: () => ({ parse(value) { return value; } }),
          },
        },
      ],
    };

    const styles = {
      wrap: { maxWidth: 720, display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" },
      title: { fontSize: 16, fontWeight: 600, margin: 0 },
      hint: { color: "var(--dsw-alias-label-tertiary)", fontSize: 13, lineHeight: 1.7, margin: 0 },
      card: { display: "flex", flexDirection: "column", gap: 12 },
      toggleRow: { display: "flex", alignItems: "center", gap: 12 },
      // Long pill segmented toggle: left "Enable", right "Disable"; the active
      // segment is highlighted.
      pillTrack: {
        display: "flex",
        borderRadius: 8,
        border: "1px solid var(--dsw-alias-border-l2)",
        overflow: "hidden",
        flexShrink: 0,
      },
      pillSeg: (active) => ({
        minWidth: 72,
        padding: "7px 14px",
        textAlign: "center",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        background: active ? "var(--dsw-alias-accent-fill, #d0bfff)" : "var(--dsw-alias-bg-layer-2, #2e2e3e)",
        color: active ? "#1a1a2e" : "var(--dsw-alias-label-secondary, inherit)",
        border: "none",
        transition: "background 0.15s ease",
      }),
      toggleText: { display: "flex", flexDirection: "column", gap: 2 },
      label: { fontSize: 14, fontWeight: 500 },
      sub: { fontSize: 12, color: "var(--dsw-alias-label-tertiary)", margin: 0 },
      rulesLabel: { fontSize: 13, fontWeight: 500 },
      list: { display: "flex", flexDirection: "column", gap: 6 },
      empty: { fontSize: 13, color: "var(--dsw-alias-label-tertiary)", margin: 0, padding: "8px 0" },
      ruleRow: {
        display: "flex", alignItems: "center", gap: 8,
        border: "1px solid var(--dsw-alias-border-l2)",
        background: "var(--dsw-alias-bg-layer-2)",
        borderRadius: 8, padding: "6px 10px",
      },
      ruleCode: { flex: 1, fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12.5, lineHeight: 1.5, wordBreak: "break-all" },
      removeBtn: {
        padding: "2px 8px", borderRadius: 6, border: "1px solid var(--dsw-alias-border-l2)",
        background: "transparent", color: "var(--dsw-alias-label-tertiary)", fontSize: 12, cursor: "pointer",
      },
      addRow: { display: "flex", gap: 8 },
      input: {
        flex: 1, boxSizing: "border-box", fontFamily: "ui-monospace, Menlo, Consolas, monospace",
        fontSize: 12.5, padding: "8px 10px", borderRadius: 8,
        border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-2)", color: "inherit",
      },
      addBtn: {
        padding: "8px 14px", borderRadius: 8, border: "1px solid var(--dsw-alias-border-l2)",
        background: "var(--dsw-alias-accent-fill, #d0bfff)", color: "#1a1a2e", fontWeight: 600, cursor: "pointer",
      },
      error: { fontSize: 13, color: "var(--dsw-alias-state-error-primary, #c62828)", margin: 0 },
    };

    function BashPrefixPanel({ get, set, t }) {
      const [enabled, setEnabled] = React.useState(false);
      const [rules, setRules] = React.useState([]);
      const [draft, setDraft] = React.useState("");
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState(null);
      const [loaded, setLoaded] = React.useState(false);

      // The client api resolves with the RPC envelope { ok, value }; unwrap the
      // business result when present (same as the dsh-model-sync pattern).
      const unwrap = (r) => (r && r.ok === true && r.value !== undefined ? r.value : r);
      const applyState = (s) => {
        const state = unwrap(s);
        setEnabled(!!(state && state.enabled));
        setRules(Array.isArray(state && state.rules) ? state.rules : []);
        if (state && state.error) setError(String(state.error));
        return state;
      };

      React.useEffect(() => {
        get()
          .then(applyState)
          .catch((e) => setError(String((e && e.message) || e)))
          .finally(() => setLoaded(true));
      }, []);

      const commit = async (payload) => {
        setBusy(true);
        setError(null);
        try {
          applyState(await set(payload));
        } catch (e) {
          setError(String((e && e.message) || e));
        } finally {
          setBusy(false);
        }
      };

      // Toggle persists only `enabled`, never touching the rules.
      const onToggleTo = (next) => {
        if (busy || !loaded || next === enabled) return;
        void commit({ enabled: next });
      };

      // Add persists the new rule list (append current draft line).
      const addRule = () => {
        const line = draft.trim();
        if (line === "") return;
        void commit({ rules: [...rules, line] }).then(() => setDraft(""));
      };

      const removeRule = (idx) => {
        const next = rules.filter((_, i) => i !== idx);
        void commit({ rules: next });
      };

      const handleDraftKeyDown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const line = draft.trim();
          if (line === "") return;
          void commit({ rules: [...rules, line] }).then(() => setDraft(""));
        }
      };

      return React.createElement("div", { style: styles.wrap },
        React.createElement("h2", { style: styles.title }, t("title")),
        React.createElement("p", { style: styles.hint }, t("hint")),

        React.createElement("div", { style: styles.card },

          // Bar-style sliding switch toggle
          React.createElement("div", { style: styles.toggleRow },
            React.createElement("div", { style: styles.pillTrack },
              React.createElement("button", {
                type: "button",
                style: styles.pillSeg(enabled),
                "aria-pressed": enabled,
                onClick: () => { onToggleTo(true); },
                children: t("toggleOn"),
              }),
              React.createElement("button", {
                type: "button",
                style: styles.pillSeg(!enabled),
                "aria-pressed": !enabled,
                onClick: () => { onToggleTo(false); },
                children: t("toggleOff"),
              })
            ),
            React.createElement("div", { style: styles.toggleText },
              React.createElement("span", { style: styles.label }, t("toggleLabel")),
              React.createElement("p", { style: styles.sub }, enabled ? t("toggleOnDesc") : t("toggleOffDesc"))
            )
          ),

          React.createElement("label", { style: styles.rulesLabel }, t("rulesLabel")),

          // Rule list
          React.createElement("div", { style: styles.list },
            rules.length === 0
              ? React.createElement("p", { style: styles.empty }, t("empty"))
              : rules.map((line, idx) =>
                  React.createElement("div", { key: idx, style: styles.ruleRow },
                    React.createElement("code", { style: styles.ruleCode }, line),
                    React.createElement("button", {
                      type: "button",
                      style: styles.removeBtn,
                      title: t("remove"),
                      disabled: busy,
                      onClick: () => removeRule(idx),
                      children: "×",
                    })
                  )
                )
          ),

          // Add row: input + Add button
          React.createElement("div", { style: styles.addRow },
            React.createElement("input", {
              style: styles.input,
              value: draft,
              disabled: busy || !loaded,
              placeholder: t("inputPlaceholder"),
              spellCheck: false,
              onChange: (e) => setDraft(e.target.value),
              onKeyDown: handleDraftKeyDown,
            }),
            React.createElement("button", {
              type: "button",
              style: styles.addBtn,
              disabled: busy || !loaded || draft.trim() === "",
              onClick: addRule,
              children: t("add"),
            })
          ),

          error
            ? React.createElement("p", { style: styles.error }, t("error").replace("{msg}", error))
            : null
        )
      );
    }

    function apply(ctx) {
      const mountReady = ctx.remote.$mount(TYPERT_REMOTE);
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-bash-prefix: dictionaries");
      const t = ctx.locale.bind(NS);

      const withApi = async () => {
        await mountReady;
        const api = ctx.get("remote.bashPrefix");
        if (!api) throw new Error("bashPrefix remote is unavailable");
        return api;
      };
      const get = async () => (await withApi()).get();
      const set = async (payload) => (await withApi()).set(payload);
      const injected = () => ({ get, set, t });

      ctx.slots.inject("settings.section", () => ctx.slots.register({
        name: "settings.section",
        id: "bash-prefix",
        order: 42,
        label: () => t("nav"),
        locale: NS,
        inject: injected,
      }, BashPrefixPanel));
    }

    exports.NS = NS;
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
