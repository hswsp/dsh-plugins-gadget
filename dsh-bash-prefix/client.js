// Client half of dsh-bash-prefix: a Settings panel ("设置 → Bash 预处理")
// with an "Editable" lock and a free-form preamble textarea. The Host prepends
// the preamble to every DSH bash command whenever the preamble is non-empty
// (see index.js).
//
// Persistence goes through the "bashPrefix" Typert Remote (get/set), the same
// proven pattern as dsh-model-sync — the panel never pokes settings internals.

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
      hint: "只要下面的文本框非空，每次 DSH 执行 bash 命令都会先自动运行这里的内容，再运行本次命令本身。常用于每次 bash 前设置代理环境变量。",
      editableLabel: "Editable（允许编辑文本）",
      editableOn: "可编辑：下面的文本框可以修改",
      editableOff: "锁定：下面的文本框只读，先点开 Editable 才能改",
      preambleLabel: "每次 bash 前先执行的命令",
      preamblePlaceholder: "# 例：\nexport https_proxy=http://127.0.0.1:7897\nexport http_proxy=http://127.0.0.1:7897\nexport all_proxy=socks5://127.0.0.1:7897",
      save: "保存",
      saved: "已保存 ✓",
      error: "保存失败：{msg}",
    };
    const en = {
      nav: "Bash Preamble",
      title: "Bash preamble (VPN / proxy)",
      hint: "As long as the textarea below is non-empty, every DSH bash command first runs its contents, then the command itself. Commonly used to export proxy env vars (https_proxy / http_proxy / all_proxy) before each bash.",
      editableLabel: "Editable (allow editing the text)",
      editableOn: "Editable: the textarea below can be edited",
      editableOff: "Locked: the textarea is read-only; tick Editable to edit",
      preambleLabel: "Commands to run before every bash call",
      preamblePlaceholder: "# e.g.\nexport https_proxy=http://127.0.0.1:7897\nexport http_proxy=http://127.0.0.1:7897\nexport all_proxy=socks5://127.0.0.1:7897",
      save: "Save",
      saved: "Saved ✓",
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
            codec: { mode: "strict", typeSymbol: "dsh-bash-prefix#BashPrefixPayload", schema: { parse(value) { return value; } } },
          }],
          result: {
            mode: "strict",
            typeSymbol: "dsh-bash-prefix#BashPrefixState",
            schema: { parse(value) { return value; } },
          },
        },
      ],
    };

    const styles = {
      wrap: { maxWidth: 720, display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" },
      title: { fontSize: 16, fontWeight: 600, margin: 0 },
      hint: { color: "var(--dsw-alias-label-tertiary)", fontSize: 13, lineHeight: 1.7, margin: 0 },
      card: { border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-3)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 },
      row: { display: "flex", alignItems: "center", gap: 10 },
      rowText: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
      label: { fontSize: 14, fontWeight: 500 },
      sub: { fontSize: 12, color: "var(--dsw-alias-label-tertiary)", margin: 0 },
      preambleLabel: { fontSize: 13, fontWeight: 500 },
      textarea: {
        width: "100%",
        minHeight: 128,
        boxSizing: "border-box",
        fontFamily: "ui-monospace, Menlo, Consolas, monospace",
        fontSize: 12.5,
        lineHeight: 1.6,
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid var(--dsw-alias-border-l2)",
        background: "var(--dsw-alias-bg-layer-2)",
        color: "inherit",
        resize: "vertical",
      },
      button: {
        alignSelf: "flex-start",
        padding: "7px 16px",
        borderRadius: 8,
        border: "1px solid var(--dsw-alias-border-l2)",
        background: "var(--dsw-alias-accent-fill, #d0bfff)",
        color: "#1a1a2e",
        fontWeight: 600,
        cursor: "pointer",
      },
      saved: { fontSize: 13, color: "var(--dsw-alias-state-success-primary, #2e7d32)", margin: 0 },
      error: { fontSize: 13, color: "var(--dsw-alias-state-error-primary, #c62828)", margin: 0 },
      readonly: { opacity: 0.55, cursor: "not-allowed" },
    };

    function BashPrefixPanel({ get, set, t }) {
      const [editable, setEditable] = React.useState(false);
      const [preamble, setPreamble] = React.useState("");
      const [busy, setBusy] = React.useState(false);
      const [status, setStatus] = React.useState(null); // "saved" | {error}
      const [loaded, setLoaded] = React.useState(false);
      const statusTimer = React.useRef(null);

      React.useEffect(() => {
        get()
          .then((s) => {
            setEditable(!!(s && s.editable));
            setPreamble((s && s.preamble) || "");
            setLoaded(true);
          })
          .catch((e) => setStatus({ error: String((e && e.message) || e) }));
      }, []);

      // One-shot feedback: show "saved"/error, then auto-clear after a moment.
      const showStatus = (msg) => {
        if (statusTimer.current) clearTimeout(statusTimer.current);
        setStatus(msg);
        statusTimer.current = setTimeout(() => setStatus(null), 2500);
      };
      React.useEffect(() => () => { if (statusTimer.current) clearTimeout(statusTimer.current); }, []);

      // The editable lock is a UI-only concern: toggling it persists only
      // `editable`, never touching the preamble text.
      const onEditable = (checked) => {
        setEditable(checked);
        setBusy(true);
        set({ editable: checked })
          .then((s) => {
            setEditable(!!(s && s.editable));
            showStatus("saved");
          })
          .catch((e) => showStatus({ error: String((e && e.message) || e) }))
          .finally(() => setBusy(false));
      };

      // Save persists ONLY the preamble text, exactly as typed. It never
      // auto-clears the text — the only way it becomes empty is the user
      // deleting it themselves.
      const onSave = () => {
        setBusy(true);
        set({ preamble })
          .then((s) => {
            setPreamble((s && typeof s.preamble === "string" ? s.preamble : preamble));
            showStatus("saved");
          })
          .catch((e) => showStatus({ error: String((e && e.message) || e) }))
          .finally(() => setBusy(false));
      };

      return React.createElement("div", { style: styles.wrap },
        React.createElement("h2", { style: styles.title }, t("title")),
        React.createElement("p", { style: styles.hint }, t("hint")),

        React.createElement("div", { style: styles.card },
          React.createElement("div", { style: styles.row },
            React.createElement("input", {
              type: "checkbox",
              checked: editable,
              disabled: busy || !loaded,
              onChange: (e) => onEditable(e.target.checked),
              style: { width: 18, height: 18, accentColor: "#d0bfff" },
            }),
            React.createElement("div", { style: styles.rowText },
              React.createElement("span", { style: styles.label }, t("editableLabel")),
              React.createElement("p", { style: styles.sub }, editable ? t("editableOn") : t("editableOff"))
            )
          ),
          React.createElement("label", { style: styles.preambleLabel }, t("preambleLabel")),
          React.createElement("textarea", {
            style: { ...styles.textarea, ...(!editable ? styles.readonly : {}) },
            value: preamble,
            disabled: busy || !loaded,
            readOnly: !editable,
            placeholder: t("preamblePlaceholder"),
            onChange: (e) => setPreamble(e.target.value),
            spellCheck: false,
          }),
          React.createElement("button", { style: styles.button, onClick: onSave, disabled: busy || !loaded }, busy ? "…" : t("save")),
          status === "saved"
            ? React.createElement("p", { style: styles.saved }, t("saved"))
            : status && status.error
              ? React.createElement("p", { style: styles.error }, t("error").replace("{msg}", status.error))
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
