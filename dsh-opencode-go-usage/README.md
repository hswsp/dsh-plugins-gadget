# dsh-opencode-go-usage

[English](README.en.md) | 中文

> **本目录是适配 fork。** 源码来自上游 [`v587d/dsh-opencode-go-usage`](https://github.com/v587d/dsh-opencode-go-usage)（MIT），
> 跟随 opencode 的两次变化做了适配（详见 [适配说明](#适配说明)）：
> ① dsh `0.1.2-rc.1` 移除了客户端 `connection.api`，provider 探测改读 durable `modelSelection` 投影；
> ② opencode 下线了旧 SSR 用量页（`/workspace/<wrk>/go`）、控制台改为 JSON API，
> 凭据也从旧 `auth` cookie 换成控制台会话 token（`st_…`）——本 fork 已改为直接调
> `/console/api` JSON 接口（`Admin Bearer`），不需要 cookie 也不需要抓 HTML。

[![npm](https://img.shields.io/npm/v/dsh-ocgo-usage)](https://www.npmjs.com/package/dsh-ocgo-usage)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

![Footer demo](assets/custom-footer.png)

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) **bundle**，在 Web 界面的输入框上方 dock（与内置 token 统计同位置）显示 [OpenCode Go](https://opencode.ai/docs/go/) 订阅用量。

它是 [pi-ocgo-usage](https://github.com/v587d/pi-ocgo-usage)（Pi 插件）的 Web 对应物：三个用量窗口（5h 滚动 / 每周 / 每月）的百分比与重置倒计时，按阈值变色，让你在窗口耗尽、请求被限流之前就发现。

```
OpenCode Go: 5h 0% (1h 23m) · wk 65% (2d 20h) · mo 83% (6d 21h) · upd 20:15
```

## 特性

- **三个窗口** —— 5h 滚动 / 每周 / 每月 的百分比 + 重置倒计时
- **颜色阈值** —— 正常 → 黄色警告（≥80%）→ 红色错误（≥90% 或已限流）
- **数据新鲜度** —— `upd HH:MM` 显示最近一次成功抓取时间
- **轻量轮询** —— 每 10s 轮询（切回标签页立即刷新）；host 端 300s 缓存（TTL 可配）+ 60s 失败冷却，不会频繁打扰 opencode.ai
- **Provider 感知** —— 仅当会话当前模型走 `opencode-go` provider 时显示；每次轮询读取会话的 durable `modelSelection` 投影（客户端 `sessions` 服务，内存读、毫秒级；失败时回退 `session.projections` Remote），切到 DeepSeek 官方等其它 provider 后一个轮询周期内自动隐藏，切回自动恢复（与 pi-ocgo-usage 行为一致）
- **点击展开** —— 详情面板显示每个窗口的重置倒计时，左下角 `Set` 可配置凭据，右侧 `refresh upd HH:MM` 手动刷新
- **内置凭据编辑器** —— 无需碰终端：`Set` 面板直接修改 workspace id 与 cookie（输入框以 `••••` + 末尾 4 位显示，点击外部 / Esc / 保存确认写入）
- **优雅降级** —— 配置缺失显示 `<err:noconfig>`，HTTP 失败显示 `<err:httpXXX>`；出错时点击 chip 直接进入 Set 面板
- **Cookie 只在 host 侧** —— 浏览器只访问同源 `/api/ocgo-usage` JSON 端点，cookie 永不进入页面

> **⚠️ 需要 OpenCode Go 会话 cookie。** 该 cookie 是完整用户会话（不是 API key），可访问你 OpenCode 账户的全部内容。请像对待密码一样对待它——见 [配置](#配置)。

## 环境要求

- DeepSeek Harness `0.1.2-rc.1` 或更新（web profile）——`0.1.5-rc.2` 与 `0.1.7-rc.2` 已验证
- `PATH` 上有 pnpm（`dsh plugin` 需要）

## 安装

这是一个标准的 dsh **bundle**：`package.json` 声明了 `dsh.bundle`，通过 `dsh plugin --profile web add <spec>` 安装（pnpm 转发器），自动加入 profile 的 `dsh.profile.bundles`。仓库内置预构建的 `lib/` 产物，**安装无需任何构建步骤或构建权限**——遵循官方 [publish 指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)。

### 从 GitHub 安装（推荐）

```sh
dsh plugin --profile web add github:v587d/dsh-opencode-go-usage
```

因为 `lib/` 已提交到仓库，pnpm 直接安装构建好的包，不会要求构建脚本授权。

### 从 npm 安装（发布后）

```sh
dsh plugin --profile web add dsh-ocgo-usage
```

> **关于包名：** 仓库名为 `dsh-opencode-go-usage`，但 npm 上同名包已被他人抢先占用（一个功能类似的第三方插件），因此 npm 发布名定为 `dsh-ocgo-usage`。GitHub 安装（推荐）不受影响：`dsh plugin --profile web add github:v587d/dsh-opencode-go-usage`。

### 从 tarball 安装

```sh
pnpm pack            # 在本仓库内 → dsh-ocgo-usage-0.1.0.tgz
dsh plugin --profile web add ./dsh-ocgo-usage-0.1.0.tgz
```

### 本地开发安装

```sh
git clone https://github.com/v587d/dsh-opencode-go-usage.git
cd dsh-opencode-go-usage
pnpm install
pnpm run build
dsh plugin --profile web add link:$(pwd)
```

**重启 `dsh web` 并刷新页面**，chip 出现在输入框上方的 dock。不启动即可验证插件层已组合：

```sh
dsh --profile web --dump-config   # 应显示 "# == dsh-ocgo-usage" 层
```

## 配置

### 方式一：界面内 Set 面板（最简单）

点击 chip 展开详情 → 左下角 `Set` → 输入 workspace id 与控制台 token（`st_…`，可选填 API key；已设置的值以 `••••` + 末尾 4 位显示，聚焦即可输入新值）→ 点击外部 / Esc / 保存按钮确认，立即生效。

![Set editor](assets/set-cookie-wid.png)

### 方式二：环境变量（`OPENCODE_GO_*`）

```sh
# 推荐：控制台会话 token（能看预算与余额）——来自浏览器 __Host-console_session
export OPENCODE_GO_CONSOLE_TOKEN="st_..."
# 或：service-account API key（仅累计用量）
export OPENCODE_GO_API_KEY="..."
# 或（旧版兼容）：cookie
# export OPENCODE_GO_COOKIE="auth=Fe26.2*...; oc_locale=en"
export OPENCODE_GO_WORKSPACE_ID="wrk_01XXXXXXXXXXXXXXXXXXXXXXXX"
```

### 方式三：配置文件

写入 `$DSH_HOME/ocgo-usage.json`（桌面版 `$DSH_HOME` = `~/Library/Application Support/dsh-desktop/harness`）：

```jsonc
{
  "token": "st_...",
  "workspaceID": "wrk_01XXXXXXXXXXXXXXXXXXXXXXXX"
}
```

```sh
chmod 600 $DSH_HOME/ocgo-usage.json
```

优先级：环境变量 > 配置文件 > 内置默认。

### 可选覆盖项

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `OPENCODE_GO_BASE_URL` | `https://opencode.ai` | API 基础地址 |
| `OPENCODE_GO_CACHE_TTL` | `300` | host 缓存秒数，范围 60–3600 |
| `OPENCODE_GO_TIMEOUT_MS` | `10000` | HTTP 超时 |

组合层配置（`~/.dsh/profiles/web/cordis.patch.yml`）：

```yaml
- id: ocgo-usage
  config:
    enabled: false    # 总开关，默认 true
```

> **Cookie 过期：** `auth` cookie 签发后有效期 1 年。过期（或被吊销）后页面 302 跳转到登录页，chip 显示 `<err:http302>` 而非过期数字。重新登录 opencode.ai 后，通过 Set 面板更新 cookie 即可。

## 使用

点击 chip 展开详情面板：每个窗口显示完整名称、百分比与重置倒计时；右下角 `refresh upd HH:MM` 手动刷新并显示数据时间。

![Usage detail](assets/usage-detail.png)

## 工作原理

- **Host 半**（`src/index.ts`、`src/service.ts`、`src/api.ts`、`src/routes.ts`）—— 携带 cookie 抓取 `GET /workspace/<wrk>/go`，解析 SSR 渲染的 `data-slot="usage-item"` 块为每个窗口的 `{percent, resetInSec, status}`，缓存结果，通过同源 JSON 端点 `/api/ocgo-usage`（+ `/api/ocgo-usage/refresh`、`/api/ocgo-usage/config`）提供数据。
- **浏览器半**（`src/client/`）—— 向 `conversation.input.right` slot（输入框工具行，紧邻模型选择器）注册 chip，每 10s 轮询 host 端点，按严重级别着色渲染三个窗口；可见性来自客户端 `sessions` 服务的 durable `modelSelection` 投影（见 [适配说明](#适配说明)）。

浏览器永远看不到 cookie；抓取与解析全部在 host 侧完成。

## 安全

- `auth` cookie 是**完整的 OpenCode 用户会话**。任何人拿到它都能访问你账户内的所有 workspace、订阅与账单信息。
- 插件**绝不**记录 cookie、不把它放进错误信息、不发送给浏览器。
- 配置编辑器只把新值写入 `$DSH_HOME/ocgo-usage.json`（chmod 600），浏览器始终只看到 `••••` + 末尾 4 位的掩码视图。

## 适配说明

**v0.2.0（opencode 控制台改版后）**：opencode 下线了旧 SSR 用量页（`/workspace/<wrk>/go`，
`data-slot="usage-item"` 已不存在，页面重定向到登录/OAuth），控制台改为同源 JSON API
（`https://opencode.ai/console/api/…`），会话凭据也从旧的 `auth=Fe26.2*…` cookie 换成
`__Host-console_session`（值形如 `st_…`）。旧三窗口接口（5h 滚动/每周/每月）现在只存在于
`/api/internal`，普通用户会话也被拒（403）；本 fork 改为抓控制台公开 JSON 端点：

| 端点 | 鉴权 | 内容 |
| --- | --- | --- |
| `GET /console/api/usage/summary` | Bearer（token 或 API key）+ `x-org-id` | 累计请求/输入/输出/缓存 tokens/费用 |
| `GET /console/api/budgets/org` | Bearer（仅 token） | 月度预算窗口：已用/额度/重置时间 |
| `GET /console/api/billing/status` | Bearer（仅 token） | 预付费余额 |

所以本 fork 的凭据模型是：**workspace id + 控制台会话 token（`st_…`）**（推荐，可看预算与余额），
或 **workspace id + service-account API key**（仅累计用量）。两种都走 `Authorization: Bearer`，
不需要浏览器 cookie。相应地 chip 显示变为：月度预算百分比 + 费用 + 请求数；展开面板显示
预算窗口、输入/输出/缓存 tokens、费用与余额。

**v0.1.2（dsh 客户端改版后）**：dsh `0.1.2-rc.1` 重写了客户端连接层，`connection` 服务的
`api` 字段被移除，Remote 迁到 `ctx.remote.<namespace>`。旧的
`connection.api.sessions.models()` 探测永久拿到 `undefined`，chip 在每个会话都 `return null`
（不报错、不落日志，表现为"插件不见了"）。本 fork 的改动：

| 位置 | 改动 |
| --- | --- |
| `src/client/index.ts` | 删除 `connection` 注入与 `connection.api.sessions.models()` 探测；新增 `readProvider()`：先读客户端 `sessions` 服务的 durable `modelSelection` 投影（`binding(id).session.projections.faceOf('modelSelection')`，内存读），取不到再回退 `remote.session.projections({ sessionId })` 的 `values.modelSelection` |
| `src/client/index.ts` | 两条路径都用 `{ lastUsed, next }` 的同一份 wire 视图，`next` 优先；两者都拿不到时返回 `undefined`（chip 隐藏，不误报） |
| `src/config.ts` / `src/api.ts` / `src/service.ts` | 凭据改 `token` / `apiKey`（`OPENCODE_GO_CONSOLE_TOKEN` / `OPENCODE_GO_API_KEY`，旧 `OPENCODE_GO_COOKIE` 保留兼容）；摘取方式见上表 |
| `lib/` | 每次改动后用 `pnpm run build` 重建（安装无需构建步骤） |
| `package.json` | 版本 `0.2.0`；`dsh.compatibility.dshReleases`（`0.1.5-rc.2` / `0.1.7-rc.2` = compatible） |

对应口径的官方写法可参考 dsh 自带的 `dsh-client-ui-model-selection`：它同样从
`binding.session.projections.faceOf('modelSelection')` 读当前选择，可见本改法与官方路径一致。

## 开发

```sh
pnpm install
pnpm run build     # tsc -b && tsdown → lib/
pnpm run typecheck # tsc -b --pretty false
pnpm test          # vitest run（解析器 / 配置 / 服务）
```

构建配置（`shared/tsdown.client.ts`）改编自 [dsh-balance-meter](https://github.com/Ghost011118/dsh-balance-meter)（BSD-3-Clause），后者是官方 DSH `packages/client/tsdown.client.ts` 的副本——它产出 web shell 模块表所需的 `window.__ModuleLoader__.load({id, factory})` 闭包工厂产物。

## License

MIT —— 见 [LICENSE](./LICENSE)。

## Changelog

### v0.2.0 · gadget 适配版（opencode 控制台改版）

- 🔄 **数据源改为 console JSON API**：`/console/api/usage/summary`、`/budgets/org`、`/billing/status`
- 🔑 **凭据改为 token / API key**：`OPENCODE_GO_CONSOLE_TOKEN`（`st_…`）或 `OPENCODE_GO_API_KEY`，`Authorization: Bearer`，不再依赖浏览器 cookie；旧 `OPENCODE_GO_COOKIE` 保留兼容
- 🖥️ **chip 显示改版**：月度预算 % + 费用 + 请求数；面板显示预算窗口（已用/额度/重置）、输入/输出/缓存 tokens、费用、余额

### v0.1.2 · gadget 适配版（dsh 客户端改版）

- 🩹 **修复 dsh ≥ 0.1.2-rc.1 上 chip 完全不显示**：`connection.api` 已被移除，provider 探测改为读取
  durable `modelSelection` 投影（`sessions` 客户端服务，回退 `session.projections` Remote）
- 📦 `dsh.compatibility.dshReleases` 标注 `0.1.5-rc.2` / `0.1.7-rc.2` 已验证

### v2.0.0 - 中英双语支持

**🎉 重大更新：现在支持中文界面了！**

- **🌏 国际化 (i18n) 支持**：自动识别 DeepSeek Harness 的中文/英文界面语言
  - 新增中文标签解析：`滚动用量`、`每周用量`、`每月用量`
  - 新增中文时间单位支持：秒、分钟、小时、天、周、月、年
  - 智能匹配中英文重置提示：`Resets in` / `重置于`
- **🎨 深色模式优化**：调整 Logo 在深色主题下的对比度，视觉更舒适
- **🧪 完整测试覆盖**：新增中文场景单元测试，确保解析准确性

特别感谢 [@waknow](https://github.com/waknow) 贡献了核心的中文本地化功能！🙏

> 💡 **版本选择建议**：
> - 喜欢纯英文界面？继续使用 [v1.1.0](https://github.com/v587d/dsh-opencode-go-usage/releases/tag/v1.1.0)
> - 需要中英双语支持？升级到 v2.0.0+

---
