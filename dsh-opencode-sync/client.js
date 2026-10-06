// Client half of the dsh-model-sync plugin.
// Hand-written browser bundle in the lazy-CJS format the client module loader
// expects: it only REGISTERS the factory; the body runs at materialization.
// It mounts the modelSync Remote, registers a settings.section sidebar entry
// ("模型同步"), and renders the sync panel.
window.__ModuleLoader__.load({
  id: "dsh-model-sync",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    const React = require("react");

    const NS = "settings.modelSync";
    const inject = ["slots", "locale", "remote"];

    const zh = {
      nav: "模型同步",
      title: "同步 OpenCode Go / Zen 模型",
      hint: "点击「刷新」从 opencode.ai 拉取最新模型列表：opencode-go 全量同步；zen 只同步你在 opencode.ai 启用的模型。容量（上下文窗口 / 输出上限）按官方目录覆盖。",
      apiKeyLabel: "OpenCode API Key（可选）",
      apiKeyPlaceholder: "粘贴 opencode.ai 的 workspace API Key…",
      apiKeySaved: "已保存 API Key，下次同步无需再填。",
      apiKeyEmpty: "未填写 Key，将使用已保存的 Key（ZEN_API_KEY / 环境变量）。",
      apiAccountTitle: "账户可用模型",
      apiAccountZen: "Zen 可用 {n} 个模型",
      apiAccountGo: "Go 可用 {n} 个模型",
      apiAccountZenError: "Zen 模型数获取失败（{err}）",
      apiAccountGoError: "Go 模型数获取失败（{err}）",
      apiAccountNoKey: "未设置 Key，无法获取账户信息。",
      apiAccountLoading: "获取账户信息…",
      saveKey: "保存 Key",
      loading: "同步中…",
      refresh: "刷新",
      go: "OpenCode Go",
      zen: "OpenCode Zen",
      sync: "同步",
      idle: "点击「同步」拉取该提供商的最新模型。",
      unchanged: "无变化（已是最新）",
      catalogTotal: "已按官方 Endpoints 重建目录：{n} 个模型，写入 {paths} 个文件",
      catalogFailed: "{n} 个文件写入失败",
      catalogRestart: "重启 DSH 后 per-model 协议分发生效（luna/grok→responses、glm/kimi→completions、minimax/qwen→anthropic）",
      total: "共 {n} 个模型",
      added: "新增 {n}",
      removed: "移除 {n}",
      none: "0",
      extra: "以下模型在官方列表中出现，但已安装的 catalog 尚未收录，已跳过：{ids}",
      extraHint: "这些模型需要更新 pi-ai（或等待内置 catalog 收录）后才能同步。",
      skippedFromSubscription: "以下模型不在当前 Go 订阅名单中（官网 current list 未包含），已跳过：{ids}",
      fallback: "以下模型未在官方目录中找到容量，保留了原值：{ids}",
      skippedNotConfigured: "尚未在「设置 → 模型」中添加该提供商，请先添加后再同步。",
      noApiKey: "未找到可用的 workspace API Key（OPENCODE_WORKSPACE_API_KEY / OPENCODE_GO_API_KEY / ZEN_API_KEY）。zen 的启用模型在 opencode.ai 管理，只有带上该 Key，接口才会只返回你启用的模型；没有 Key 时不会同步 zen（避免误把全部模型写进来）。",
      unauthorized: "API Key 无效或已过期（401）。",
      network: "网络请求失败，请稍后重试。",
      timeout: "请求超时，请稍后重试。",
      httpError: "接口返回 HTTP {status}。",
      badJson: "接口响应解析失败。",
      notConfigured: "llm-pi-ai 设置尚未就绪，请先在「设置 → 模型」中添加 opencode-go 与 opencode（zen）提供商。",
      writeFailed: "写入设置失败：{msg}",
      remoteFailed: "远程调用失败：{msg}",
      workspaceLink: "管理 zen 启用的模型",
    };
    const en = {
      nav: "Model Sync",
      title: "Sync OpenCode Go / Zen models",
      hint: "Click Refresh to pull the latest model lists from opencode.ai: opencode-go syncs the full list; zen syncs only the models you enabled at opencode.ai. Capacities (context window / max output) are overwritten from the official catalog.",
      apiKeyLabel: "OpenCode API key (optional)",
      apiKeyPlaceholder: "Paste your opencode.ai workspace API key…",
      apiKeySaved: "API key saved; later syncs reuse it.",
      apiKeyEmpty: "No key entered — will use the saved key (ZEN_API_KEY / env).",
      apiAccountTitle: "Account available models",
      apiAccountZen: "Zen: {n} models available",
      apiAccountGo: "Go: {n} models available",
      apiAccountZenError: "Zen model count unavailable ({err})",
      apiAccountGoError: "Go model count unavailable ({err})",
      apiAccountNoKey: "No key set — account info unavailable.",
      apiAccountLoading: "Fetching account info…",
      saveKey: "Save key",
      loading: "Syncing…",
      refresh: "Refresh",
      go: "OpenCode Go",
      zen: "OpenCode Zen",
      sync: "Sync",
      idle: "Click Sync to pull this provider's latest models.",
      unchanged: "No changes (already up to date)",
      catalogTotal: "Catalog rebuilt from the official endpoints: {n} models, written to {paths} file(s)",
      catalogFailed: "{n} file write(s) failed",
      catalogRestart: "Restart DSH for per-model protocol dispatch (luna/grok→responses, glm/kimi→completions, minimax/qwen→anthropic)",
      total: "{n} models",
      added: "{n} added",
      removed: "{n} removed",
      none: "0",
      extra: "These models are on the official list but the installed catalog does not describe them yet; skipped: {ids}",
      extraHint: "They can be synced after pi-ai (or its built-in catalog) is updated.",
      skippedFromSubscription: "These models are not in the current Go subscription (the docs' current list); skipped: {ids}",
      fallback: "No official capacity found for these models; kept existing values: {ids}",
      skippedNotConfigured: "This provider is not added under Settings → Models yet. Add it first, then sync.",
      noApiKey: "No usable workspace API key found (OPENCODE_WORKSPACE_API_KEY / OPENCODE_GO_API_KEY / ZEN_API_KEY). Enabled zen models are managed at opencode.ai; the endpoint only returns your enabled set when called with that key, so zen is skipped without it (to avoid writing the full model list).",
      unauthorized: "API key is invalid or expired (401).",
      network: "Network request failed, try again later.",
      timeout: "Request timed out, try again later.",
      httpError: "HTTP {status} from the models endpoint.",
      badJson: "Failed to parse the models response.",
      notConfigured: "llm-pi-ai settings are not ready; add the opencode-go and opencode (zen) providers under Settings → Models first.",
      writeFailed: "Failed to write settings: {msg}",
      remoteFailed: "Remote call failed: {msg}",
      workspaceLink: "Manage enabled zen models",
    };

    // Client-side Remote contribution. The result codec is a pass-through
    // parser: the Host already validates the business result against its own
    // zod schema before it crosses the wire.
    const TYPERT_REMOTE = {
      package: "dsh-model-sync",
      descriptors: ["sync", "syncGo", "syncGoCatalog", "syncZen", "setApiKey", "fetchAccount"].map((method) => ({
        id: "dsh-model-sync#modelSync/" + method,
        service: "modelSync",
        namespace: "modelSync",
        method,
        invocation: { kind: "direct" },
        parameters: [],
        result: {
          mode: "strict",
          typeSymbol: "dsh-model-sync#ModelSyncResult",
          create: () => ({ parse(value) { return value; } }),
        },
      })),
    };

    const styles = {
      wrap: { maxWidth: 720, display: "flex", flexDirection: "column", gap: 14, padding: "8px 0" },
      title: { fontSize: 16, fontWeight: 600, margin: 0 },
      hint: { color: "var(--dsw-alias-label-tertiary)", fontSize: 13, lineHeight: 1.6, margin: 0 },
      error: { color: "var(--dsw-alias-state-error-primary)", fontSize: 13, lineHeight: 1.6, margin: 0 },
      success: { color: "var(--dsw-alias-state-success-primary)", fontSize: 13, lineHeight: 1.6, margin: 0 },
      card: { border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-3)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 },
      cardHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
      cardName: { fontSize: 14, fontWeight: 600, margin: 0 },
      cardMeta: { color: "var(--dsw-alias-label-tertiary)", fontSize: 12, margin: 0 },
      row: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--dsw-alias-label-secondary)", gap: 8 },
      list: { fontSize: 12, color: "var(--dsw-alias-label-secondary)", lineHeight: 1.6, margin: 0, wordBreak: "break-all" },
      button: { alignSelf: "flex-start", border: "1px solid var(--dsw-alias-border-l2)", color: "var(--dsw-alias-label-primary)", font: "inherit", cursor: "pointer", background: "transparent", borderRadius: 6, padding: "5px 12px" },
      link: { color: "var(--dsw-alias-state-business-primary)", fontSize: 13 },
      keyRow: { display: "flex", gap: 8, alignItems: "center" },
      keyInput: { flex: 1, border: "1px solid var(--dsw-alias-border-l2)", borderRadius: 6, padding: "6px 10px", font: "inherit", color: "var(--dsw-alias-label-primary)", background: "var(--dsw-alias-bg-layer-1)" },
      keyLabel: { fontSize: 13, fontWeight: 600, margin: 0, color: "var(--dsw-alias-label-secondary)" },
      keyHint: { fontSize: 12, color: "var(--dsw-alias-label-tertiary)", lineHeight: 1.6, margin: 0 },
      accountRow: { display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--dsw-alias-label-secondary)", lineHeight: 1.6, margin: 0 },
    };

    function joinIds(ids, t) {
      return ids.length === 0 ? t("none") : ids.join(", ");
    }

    function ProviderCard(props) {
      const { name, result, busy, onSync, t } = props;
      const lines = [];
      if (busy) {
        lines.push(React.createElement("p", { key: "loading", style: styles.cardMeta }, t("loading")));
      } else if (result && result.status === "catalog") {
        // syncGoCatalog() result: catalog file rebuilt from official data.
        lines.push(React.createElement("p", { key: "total", style: styles.cardMeta }, t("catalogTotal").replace("{n}", String(result.total)).replace("{paths}", String(result.written))));
        if (result.detail) lines.push(React.createElement("p", { key: "proto", style: styles.list }, result.detail));
        if (result.failed && result.failed.length > 0) lines.push(React.createElement("p", { key: "failed", style: styles.error }, t("catalogFailed").replace("{n}", String(result.failed.length))));
        lines.push(React.createElement("p", { key: "restart", style: styles.success }, t("catalogRestart")));
      } else if (result && result.status === "ok") {
        lines.push(React.createElement("p", { key: "total", style: styles.cardMeta }, t("total").replace("{n}", String(result.total))));
        const added = result.added || [];
        const removed = result.removed || [];
        if (added.length > 0) lines.push(React.createElement("p", { key: "added", style: styles.list }, t("added").replace("{n}", String(added.length)) + ": " + joinIds(added, t)));
        if (removed.length > 0) lines.push(React.createElement("p", { key: "removed", style: styles.list }, t("removed").replace("{n}", String(removed.length)) + ": " + joinIds(removed, t)));
        if (result.fallback && result.fallback.length > 0) lines.push(React.createElement("p", { key: "fallback", style: styles.cardMeta }, t("fallback").replace("{ids}", joinIds(result.fallback, t))));
        if (result.extra && result.extra.length > 0) {
          lines.push(React.createElement("p", { key: "extra", style: styles.list }, t("extra").replace("{ids}", joinIds(result.extra, t))));
          lines.push(React.createElement("p", { key: "extraHint", style: styles.cardMeta }, t("extraHint")));
        }
        if (result.skippedFromSubscription && result.skippedFromSubscription.length > 0) {
          lines.push(React.createElement("p", { key: "skippedSub", style: styles.cardMeta }, t("skippedFromSubscription").replace("{ids}", joinIds(result.skippedFromSubscription, t))));
        }
        if (added.length === 0 && removed.length === 0) lines.push(React.createElement("p", { key: "unchanged", style: styles.success }, t("unchanged")));
      } else if (result && result.status === "skipped") {
        lines.push(React.createElement("p", { key: "msg", style: styles.error }, t("skippedNotConfigured")));
      } else if (result && result.status === "error") {
        const err = result.error;
        let msg = err || "unknown";
        if (err === "no-api-key") msg = t("noApiKey");
        else if (err === "unauthorized") msg = t("unauthorized");
        else if (err === "network") msg = t("network");
        else if (err === "timeout") msg = t("timeout");
        else if (err === "bad-json") msg = t("badJson");
        else if (typeof err === "string" && err.startsWith("http-")) msg = t("httpError").replace("{status}", err.slice(5));
        lines.push(React.createElement("p", { key: "msg", style: styles.error }, msg));
      } else {
        lines.push(React.createElement("p", { key: "idle", style: styles.cardMeta }, t("idle")));
      }
      return React.createElement("div", { style: styles.card },
        React.createElement("div", { style: styles.cardHead },
          React.createElement("h3", { style: styles.cardName }, name),
          React.createElement("button", { style: styles.button, onClick: onSync, disabled: !!busy }, t("sync"))
        ),
        ...lines
      );
    }

    function SyncPanel(props) {
      const { query, syncGo, syncZen, setApiKey, fetchAccount, t } = props;
      const [results, setResults] = React.useState({ go: null, zen: null });
      const [busy, setBusy] = React.useState({ go: false, zen: false, all: false });
      const [fatal, setFatal] = React.useState(null);
      const [apiKey, setApiKeyInput] = React.useState("");
      const [keyMsg, setKeyMsg] = React.useState(null);
      const [account, setAccount] = React.useState(null);
      const [accountBusy, setAccountBusy] = React.useState(false);

      // fetchAccount() rides its summary in the zen result slot (see index.js):
      // unwrap the RPC envelope, then read value.zen.account.
      const extractAccount = (res) => {
        const val = res && res.ok === true && res.value !== undefined ? res.value : res;
        if (!val) return null;
        const zen = val && val.zen && typeof val.zen === "object" ? val.zen : null;
        return zen && zen.account ? zen.account : null;
      };

      const saveKey = () => {
        setKeyMsg(null);
        if (!apiKey || apiKey.length === 0) {
          setKeyMsg({ type: "hint", text: t("apiKeyEmpty") });
          return;
        }
        setKeyMsg(null);
        Promise.resolve()
          .then(() => setApiKey(apiKey))
          .then(() => {
            setKeyMsg({ type: "ok", text: t("apiKeySaved") });
            // Refresh the account counts with the newly saved key.
            setAccountBusy(true);
            return Promise.resolve().then(fetchAccount).then((res) => {
              setAccount(extractAccount(res));
            }).catch(() => {
              /* account fetch is best-effort */
            }).finally(() => setAccountBusy(false));
          })
          .catch((e) => setKeyMsg({ type: "err", text: t("remoteFailed").replace("{msg}", String((e && e.message) || e)) }));
      };

      React.useEffect(() => {
        runAll();
        setAccountBusy(true);
        Promise.resolve()
          .then(fetchAccount)
          .then((res) => {
            setAccount(extractAccount(res));
          })
          .catch(() => { /* best-effort */ })
          .finally(() => setAccountBusy(false));
      }, []);

      const applyResult = (result) => {
        // The client api resolves with the RPC envelope { ok, value }; unwrap
        // the business result when present.
        const value = result && result.ok === true && result.value !== undefined ? result.value : result;
        if (!value || value.ok === false) {
          setFatal({ error: (value && value.error) || "unknown", warning: (value && value.warning) || null });
        } else {
          setFatal(null);
        }
        // syncGoCatalog resolves to { ok, total, byProtocol, written, failed }
        // without the {go, zen} envelope: shape it into the same slot the Go
        // card renders (status total / byProtocol / written). Refresh (sync())
        // carries the same shape under value.goCatalog.
        const catalogValue = value && value.byProtocol !== undefined && value.written !== undefined
          ? value
          : value && value.goCatalog && value.goCatalog.byProtocol !== undefined ? value.goCatalog : null;
        if (catalogValue) {
          const byProto = Object.entries(catalogValue.byProtocol || {})
            .map(([p, n]) => `${p}=${n}`).join(", ");
          setResults((prev) => ({
            ...prev,
            go: {
              status: "catalog",
              total: catalogValue.total,
              detail: byProto,
              written: Array.isArray(catalogValue.written) ? catalogValue.written.length : 0,
              failed: Array.isArray(catalogValue.failed) ? catalogValue.failed : [],
            },
            zen: value && value.zen ? value.zen : prev.zen,
          }));
          return;
        }
        setResults((prev) => ({
          go: value && value.go ? value.go : prev.go,
          zen: value && value.zen ? value.zen : prev.zen,
        }));
      };
      const fail = (e) => setFatal({ error: "remote-failed", warning: String((e && e.message) || e) });

      const runAll = () => {
        setFatal(null);
        setBusy({ go: true, zen: true, all: true });
        Promise.resolve()
          .then(query)
          .then(applyResult)
          .catch(fail)
          .finally(() => setBusy({ go: false, zen: false, all: false }));
      };
      const runOne = (call, which) => () => {
        setFatal(null);
        setBusy((b) => ({ ...b, [which]: true }));
        Promise.resolve()
          .then(call)
          .then(applyResult)
          .catch(fail)
          .finally(() => setBusy((b) => ({ ...b, [which]: false })));
      };

      React.useEffect(() => { runAll(); }, []);

      return React.createElement("div", { style: styles.wrap },
        React.createElement("h2", { style: styles.title }, t("title")),
        React.createElement("p", { style: styles.hint }, t("hint")),
        React.createElement("p", { style: styles.hint },
          React.createElement("a", { style: styles.link, href: "https://opencode.ai/", target: "_blank", rel: "noreferrer" }, t("workspaceLink"))
        ),
        // API key input (top of the page) + account availability summary.
        React.createElement("div", { style: styles.card },
          React.createElement("p", { style: styles.keyLabel }, t("apiKeyLabel")),
          React.createElement("div", { style: styles.keyRow },
            React.createElement("input", {
              style: styles.keyInput,
              type: "password",
              value: apiKey,
              placeholder: t("apiKeyPlaceholder"),
              onChange: (e) => setApiKeyInput(e.target.value),
              onKeyDown: (e) => { if (e.key === "Enter") saveKey(); },
            }),
            React.createElement("button", { style: styles.button, onClick: saveKey }, t("saveKey"))
          ),
          keyMsg
            ? React.createElement("p", { style: keyMsg.type === "err" ? styles.error : keyMsg.type === "ok" ? styles.success : styles.keyHint }, keyMsg.text)
            : null,
          React.createElement("p", { style: styles.keyHint }, t("apiKeyEmpty")),
          React.createElement("p", { style: styles.keyLabel }, t("apiAccountTitle")),
          accountBusy
            ? React.createElement("p", { style: styles.keyHint }, t("apiAccountLoading"))
            : account
              ? React.createElement("p", { style: styles.accountRow },
                  account.zen !== null
                    ? t("apiAccountZen").replace("{n}", String(account.zen))
                    : t("apiAccountZenError").replace("{err}", account.zenError || "unknown"),
                  " · ",
                  account.go !== null
                    ? t("apiAccountGo").replace("{n}", String(account.go))
                    : t("apiAccountGoError").replace("{err}", account.goError || "unknown"),
                )
              : React.createElement("p", { style: styles.keyHint }, t("apiAccountNoKey")),
        ),
        fatal
          ? React.createElement("p", { style: styles.error },
              typeof fatal.error === "string"
                ? fatal.error === "write-failed" ? t("writeFailed").replace("{msg}", fatal.warning || "")
                  : fatal.error === "remote-failed" ? t("remoteFailed").replace("{msg}", fatal.warning || "")
                  : fatal.error === "fetch-failed" ? t("network")
                  : t("notConfigured")
                : String((fatal.error && fatal.error.message) || JSON.stringify(fatal.error))
            )
          : null,
        React.createElement(ProviderCard, { name: t("go"), result: results.go, busy: busy.go, onSync: runOne(syncGo, "go"), t }),
        React.createElement(ProviderCard, { name: t("zen"), result: results.zen, busy: busy.zen, onSync: runOne(syncZen, "zen"), t }),
        React.createElement("button", { style: styles.button, onClick: runAll, disabled: busy.all }, t("refresh"))
      );
    }

    function apply(ctx) {
      const mountReady = ctx.remote.$mount(TYPERT_REMOTE);
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-model-sync: dictionaries");
      const t = ctx.locale.bind(NS);

      const withApi = async () => {
        await mountReady;
        const api = ctx.get("remote.modelSync");
        if (!api) throw new Error("modelSync remote is unavailable");
        return api;
      };
      const query = async () => (await withApi()).sync();
      // opencode-go sync rebuilds the pi-ai catalog file from the official
      // per-protocol endpoint data (see index.js syncGoCatalog): this is the
      // action that makes every go model usable, so the Go card triggers it.
      const syncGo = async () => (await withApi()).syncGoCatalog();
      const syncZen = async () => (await withApi()).syncZen();
      // Persist the API key typed into the page (writes ZEN_API_KEY into the
      // DSH credentials store) and fetch the account-level model counts for
      // the availability summary shown at the top of the page.
      const setApiKey = async (key) => (await withApi()).setApiKey(key);
      const fetchAccount = async () => (await withApi()).fetchAccount();
      const injected = () => ({ query, syncGo, syncZen, setApiKey, fetchAccount, t });

      ctx.slots.inject("settings.section", () => ctx.slots.register({
        name: "settings.section",
        id: "model-sync",
        order: 41,
        label: () => t("nav"),
        locale: NS,
        inject: injected,
      }, SyncPanel));
    }

    exports.NS = NS;
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
